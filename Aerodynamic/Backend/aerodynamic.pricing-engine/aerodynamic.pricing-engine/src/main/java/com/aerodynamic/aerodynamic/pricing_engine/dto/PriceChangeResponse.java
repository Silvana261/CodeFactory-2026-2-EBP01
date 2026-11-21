package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PriceChangeResponse(
        UUID id, String flightId, Long basePrice, Long dynamicPrice,
        LocalDateTime changedAt, List<PriceChangeRuleResponse> appliedRules) {
}