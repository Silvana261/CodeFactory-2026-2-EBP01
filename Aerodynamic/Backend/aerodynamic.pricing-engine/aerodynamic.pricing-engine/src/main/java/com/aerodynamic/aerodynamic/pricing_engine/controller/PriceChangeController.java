package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceChangeResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceEvolutionResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceHistoryPageResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.PriceChangeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PriceChangeController {

    private final PriceChangeService priceChangeService;

    public PriceChangeController(PriceChangeService priceChangeService) {
        this.priceChangeService = priceChangeService;
    }

    // Scenarios 1, 3, 4: paginated history (max 20 per page) with optional date range.
    // Covered by /api/flights/** -> PRICING_ANALYST
    @GetMapping("/flights/{flightId}/price-history")
    public PriceHistoryPageResponse history(
            @PathVariable String flightId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return priceChangeService.getHistory(flightId, from, to, page, size);
    }

    // Scenario 5: chart-ready series of base and dynamic price
    @GetMapping("/flights/{flightId}/price-history/evolution")
    public PriceEvolutionResponse evolution(
            @PathVariable String flightId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return priceChangeService.getEvolution(flightId, from, to);
    }

    // Scenario 2: detail with applied rules and their adjustments
    @GetMapping("/price-changes/{id}")
    public PriceChangeResponse detail(@PathVariable UUID id) {
        return priceChangeService.getById(id);
    }
}