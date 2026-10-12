package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightEvaluationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.RuleEvaluationResult;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.ConditionOperator;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PricingRuleRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingEvaluationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PricingEvaluationServiceImpl implements PricingEvaluationService {

    private final FlightRepository flightRepository;
    private final PricingRuleRepository ruleRepository;

    public PricingEvaluationServiceImpl(FlightRepository flightRepository,
                                        PricingRuleRepository ruleRepository) {
        this.flightRepository = flightRepository;
        this.ruleRepository = ruleRepository;
    }

    @Override
    public FlightEvaluationResponse evaluate(String flightId) {
        // CA01 / RF01: el vuelo debe existir
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flight not found"));

        // Se evalúan todas las reglas; las inactivas se marcan, no se omiten
        List<PricingRule> rules = ruleRepository.findAll();

        // CA02, CA03, CA04, RF05
        List<RuleEvaluationResult> results = rules.stream()
                .map(rule -> evaluateRule(flight, rule))
                .toList();

        // CA05 / RF06 / RF07: cumplida Y activa
        List<Long> applicable = results.stream()
                .filter(r -> r.isMet() && r.isRuleActive())
                .map(RuleEvaluationResult::getRuleId)
                .toList();

        // CA06 / RF08
        String message = applicable.isEmpty()
                ? "No applicable rules for this flight"
                : applicable.size() + " applicable rule(s)";

        return new FlightEvaluationResponse(flightId, results, applicable, message);
    }

    private RuleEvaluationResult evaluateRule(Flight flight, PricingRule rule) {
        boolean seatsDataMissing = flight.getAvailability() == null
                || flight.getCapacity() == null
                || flight.getCapacity() == 0;

        Double actual = switch (rule.getBussinessVariable()) {
            // demanda = porcentaje de asientos ocupados
            case DEMAND -> seatsDataMissing
                    ? null
                    : (flight.getCapacity() - flight.getAvailability()) * 100.0
                            / flight.getCapacity();
            // disponibilidad = porcentaje de asientos libres
            case AVAILABILITY -> seatsDataMissing
                    ? null
                    : flight.getAvailability() * 100.0 / flight.getCapacity();
            // contexto temporal = días restantes hasta la salida
            case TEMPORAL_CONTEXT -> flight.getDepartureAt() == null
                    ? null
                    : Duration.between(LocalDateTime.now(), flight.getDepartureAt())
                            .toMinutes() / 1440.0;
        };

        boolean met = false;
        String note = null;
        if (actual == null) {
            note = "Flight has no value for " + rule.getBussinessVariable();
        } else {
            // RNF01: operador y valor guardados en la regla
            met = compare(rule.getConditionOperator(), actual, rule.getConditionValue());
        }

        // RNF02: variable, valor real y condición comparada
        return new RuleEvaluationResult(
                rule.getIdRule(),
                rule.getRuleName(),
                rule.getBussinessVariable().name(),
                actual,
                rule.getConditionOperator().name(),
                rule.getConditionValue(),
                met,
                rule.getStatus() == StatusRule.ACTIVE,
                rule.getAdjustmentType().name(),
                rule.getAdjustmentValue(),
                note);
    }

    private boolean compare(ConditionOperator op, double actual, double expected) {
        return switch (op) {
            case GREATER_THAN -> actual > expected;
            case LESS_THAN -> actual < expected;
            case GREATER_THAN_OR_EQUAL -> actual >= expected;
            case LESS_THAN_OR_EQUAL -> actual <= expected;
        };
    }
}