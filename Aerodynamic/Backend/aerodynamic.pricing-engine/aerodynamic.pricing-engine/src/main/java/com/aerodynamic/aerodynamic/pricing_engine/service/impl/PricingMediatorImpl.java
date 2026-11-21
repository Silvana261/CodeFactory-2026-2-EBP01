package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightEvaluationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PricingRuleRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.PriceCalculationService;
import com.aerodynamic.aerodynamic.pricing_engine.service.PriceChangeService;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingEvaluationService;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingMediator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Mediator that coordinates flight lookup, rule evaluation, price calculation
 * and price change registration, so the services remain independent.
 */
@Service
public class PricingMediatorImpl implements PricingMediator {

    private final FlightRepository flightRepository;
    private final PricingRuleRepository pricingRuleRepository;
    private final PricingEvaluationService pricingEvaluationService;
    private final PriceCalculationService priceCalculationService;
    private final PriceChangeService priceChangeService;

    public PricingMediatorImpl(FlightRepository flightRepository,
                               PricingRuleRepository pricingRuleRepository,
                               PricingEvaluationService pricingEvaluationService,
                               PriceCalculationService priceCalculationService,
                               PriceChangeService priceChangeService) {
        this.flightRepository = flightRepository;
        this.pricingRuleRepository = pricingRuleRepository;
        this.pricingEvaluationService = pricingEvaluationService;
        this.priceCalculationService = priceCalculationService;
        this.priceChangeService = priceChangeService;
    }

    // RNF-01: calculation and registration share one transaction
    @Override
    @Transactional
    public PriceCalculationResponse calculatePrice(String flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flight not found: " + flightId));

        FlightEvaluationResponse evaluation = pricingEvaluationService.evaluate(flightId);
        List<Long> applicableRuleIds = evaluation.getApplicableRuleIds() == null
                ? List.of() : evaluation.getApplicableRuleIds();

        List<PricingRule> applicableRules = pricingRuleRepository.findAllById(applicableRuleIds)
                .stream()
                .filter(rule -> rule.getStatus() == StatusRule.ACTIVE)
                .toList();

        PriceCalculationResponse response = priceCalculationService.calculate(flight, applicableRules);

        // RF-01: register only if the dynamic price changed (decided inside the service)
        priceChangeService.registerIfChanged(flight,
                response.getBasePrice(), response.getDynamicPrice(), response.getAdjustments());

        return response;
    }
}