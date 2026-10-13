package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.util.List;

/**
 * Result of the dynamic price calculation for one flight (CA05).
 * Prices are whole numbers (no decimals).
 */
public class PriceCalculationResponse {

    private final String flightId;
    private final Long basePrice;
    private final List<AppliedAdjustment> adjustments;
    private final Long dynamicPrice;
    private final Long minimumFare;
    private final boolean minimumFareApplied;
    private final boolean adjustmentsApplied;
    private final String message;

    public PriceCalculationResponse(String flightId, Long basePrice,
                                    List<AppliedAdjustment> adjustments, Long dynamicPrice,
                                    Long minimumFare, boolean minimumFareApplied,
                                    boolean adjustmentsApplied, String message) {
        this.flightId = flightId;
        this.basePrice = basePrice;
        this.adjustments = adjustments;
        this.dynamicPrice = dynamicPrice;
        this.minimumFare = minimumFare;
        this.minimumFareApplied = minimumFareApplied;
        this.adjustmentsApplied = adjustmentsApplied;
        this.message = message;
    }

    public String getFlightId() { return flightId; }
    public Long getBasePrice() { return basePrice; }
    public List<AppliedAdjustment> getAdjustments() { return adjustments; }
    public Long getDynamicPrice() { return dynamicPrice; }
    public Long getMinimumFare() { return minimumFare; }
    public boolean isMinimumFareApplied() { return minimumFareApplied; }
    public boolean isAdjustmentsApplied() { return adjustmentsApplied; }
    public String getMessage() { return message; }
}
