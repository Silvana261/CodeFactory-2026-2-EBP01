package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;

public interface PriceCalculationService {

    /**
     * Calculates the dynamic price of a flight from its base price and the
     * pricing rules that apply to it. Does not modify the stored base price (RNF03).
     */
    PriceCalculationResponse calculatePrice(String flightId);
}
