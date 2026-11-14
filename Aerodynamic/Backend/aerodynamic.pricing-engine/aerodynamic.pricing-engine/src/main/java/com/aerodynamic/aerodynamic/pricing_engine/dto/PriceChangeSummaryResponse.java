package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** One row of the history list (no rules; those come from the detail endpoint). */
public record PriceChangeSummaryResponse(
        UUID id, Long basePrice, Long dynamicPrice, LocalDateTime changedAt) {
}