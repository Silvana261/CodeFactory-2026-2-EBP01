package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.util.List;

/** Chart-ready series (ascending by date). chartAvailable = at least 2 records. */
public record PriceEvolutionResponse(
        String flightId, boolean chartAvailable, List<PriceEvolutionPoint> points, String message) {
}
