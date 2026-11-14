package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.time.LocalDateTime;

public record PriceEvolutionPoint(LocalDateTime changedAt, Long basePrice, Long dynamicPrice) {
}