package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.AppliedAdjustment;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightEvaluationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PricingRuleRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingEvaluationService;
import com.aerodynamic.aerodynamic.pricing_engine.service.PriceCalculationService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PriceCalculationServiceImpl implements PriceCalculationService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final FlightRepository flightRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final PricingEvaluationService pricingEvaluationService;

    public PriceCalculationServiceImpl(FlightRepository flightRepository,
                                       PricingRuleRepository pricingRuleRepository,
                                       PricingEvaluationService pricingEvaluationService) {
        this.flightRepository = flightRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.pricingEvaluationService = pricingEvaluationService;
    }

    @Override
    public PriceCalculationResponse calculatePrice(String flightId) {
        // RF01: get the base price from the stored flight
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flight not found: " + flightId));

        // RF02: the evaluation tells us which rules apply to this flight.
        // ASSUMPTION: method name evaluateFlight(String) -> adjust to the real one in PricingEvaluationService.
        FlightEvaluationResponse evaluation = pricingEvaluationService.evaluate(flightId);

        // Only the ids come from the evaluation. Percentages and types are read from the stored rules (RNF01).
        // NOTE: if FlightEvaluationResponse ends up as a record, this getter becomes applicableRuleIds().
        List<Long> ids = evaluation.getApplicableRuleIds() == null
                ? List.of() : evaluation.getApplicableRuleIds();

        List<PricingRule> rules = pricingRuleRepository.findAllById(ids).stream()
                .filter(rule -> rule.getStatus() == StatusRule.ACTIVE) // only enabled rules (CA04)
                .toList();

        return calculate(flight, rules);
    }

    /**
     * Pure calculation: uses only the flight's stored values and the given rules.
     * Never modifies the flight (RNF03).
     */
    public PriceCalculationResponse calculate(Flight flight, List<PricingRule> applicableRules) {
        if (flight.getBasePrice() == null || flight.getBasePrice() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Base price must be greater than zero");
        }

        BigDecimal basePrice = BigDecimal.valueOf(flight.getBasePrice())
                .setScale(0, RoundingMode.HALF_UP);

        // Stable order (by id) so the result is always the same
        List<PricingRule> orderedRules = new ArrayList<>(applicableRules);
        orderedRules.sort(Comparator.comparing(PricingRule::getIdRule));

        // RF03, RF04, RF05: apply each adjustment on top of the previous result (successive)
        BigDecimal current = basePrice;
        List<AppliedAdjustment> adjustments = new ArrayList<>();
        for (PricingRule rule : orderedRules) {
            BigDecimal before = current;
            current = applyAdjustment(current, rule);
            adjustments.add(new AppliedAdjustment(
                    rule.getIdRule(), rule.getRuleName(), rule.getAdjustmentType().name(),
                    rule.getAdjustmentValue(), before.longValue(), current.longValue()));
        }

        // Minimum fare is a floor, only relevant when adjustments were applied
        boolean minimumFareApplied = false;
        BigDecimal minimumFare = flight.getMinimumFare() == null ? null
                : BigDecimal.valueOf(flight.getMinimumFare()).setScale(0, RoundingMode.HALF_UP);
        if (!adjustments.isEmpty() && minimumFare != null && current.compareTo(minimumFare) < 0) {
            current = minimumFare;
            minimumFareApplied = true;
        }

        // RF06: with no applicable rules, `current` is still the base price
        boolean adjustmentsApplied = !adjustments.isEmpty();
        String message = adjustmentsApplied
                ? adjustments.size() + " regla(s) de pricing aplicada(s)"
                        + (minimumFareApplied ? "; se aplicó la tarifa mínima del vuelo" : "")
                : "No se aplicaron ajustes; se conserva el precio base";

        return new PriceCalculationResponse(
                flight.getIdFlight(), basePrice.longValue(), adjustments, current.longValue(),
                minimumFare == null ? null : minimumFare.longValue(),
                minimumFareApplied, adjustmentsApplied, message);
    }

    private BigDecimal applyAdjustment(BigDecimal price, PricingRule rule) {
        BigDecimal percentage = BigDecimal.valueOf(rule.getAdjustmentValue());
        BigDecimal delta = price.multiply(percentage).divide(HUNDRED, 0, RoundingMode.HALF_UP);
        BigDecimal result = switch (rule.getAdjustmentType()) {
            case INCREASE_VALUE -> price.add(delta);
            case DECREASE_VALUE -> price.subtract(delta);
        };
        return result.max(BigDecimal.ZERO); // a price can never be negative
    }
}
