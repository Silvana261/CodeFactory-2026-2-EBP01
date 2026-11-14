package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.util.List;

/** Paginated history of a flight. "message" is filled only when there are no records. */
public record PriceHistoryPageResponse(
        String flightId, List<PriceChangeSummaryResponse> content,
        int page, int size, long totalElements, int totalPages, String message) {
}