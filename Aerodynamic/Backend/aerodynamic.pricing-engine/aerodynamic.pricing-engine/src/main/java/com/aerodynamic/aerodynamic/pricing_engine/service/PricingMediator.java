package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;

/**
 * Mediator that coordinates pricing evaluation and calculation so those
 * services do not reference each other.
 */
public interface PricingMediator {

    /**
     * Evaluates the applicable pricing rules and calculates a flight's dynamic price.
     *
     * @param flightId the identifier of the flight to calculate
     * @return the calculated price and applied adjustments
     */
    PriceCalculationResponse calculatePrice(String flightId);
}
