package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.AppliedAdjustment;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceChangeResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceEvolutionResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceHistoryPageResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PriceChange;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceChangeService {

    /** Registers a change only if the dynamic price differs from the last registered one. */
    Optional<PriceChange> registerIfChanged(Flight flight, long basePrice, long dynamicPrice,
                                            List<AppliedAdjustment> adjustments);

    /** Paginated history (max 20 per page), optionally filtered by date range. */
    PriceHistoryPageResponse getHistory(String flightId, LocalDate from, LocalDate to,
                                        int page, int size);

    /** Detail of one change, including applied rules and their adjustments. */
    PriceChangeResponse getById(UUID id);

    /** Base/dynamic price series for the chart. */
    PriceEvolutionResponse getEvolution(String flightId, LocalDate from, LocalDate to);
}