package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;

import java.util.List;

public interface PriceCalculationService {

    /**
     * Calculates the dynamic price using the flight and its applicable pricing rules.
     * Does not modify the stored base price (RNF03).
     */
    PriceCalculationResponse calculate(Flight flight, List<PricingRule> applicableRules);
}
