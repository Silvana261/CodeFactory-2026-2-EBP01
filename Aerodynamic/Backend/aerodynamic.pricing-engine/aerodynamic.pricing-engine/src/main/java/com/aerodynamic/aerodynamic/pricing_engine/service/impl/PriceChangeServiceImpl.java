package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.AppliedAdjustment;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceChangeResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceChangeRuleResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceChangeSummaryResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceEvolutionPoint;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceEvolutionResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceHistoryPageResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PriceChange;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PriceChangeRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.PriceChangeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PriceChangeServiceImpl implements PriceChangeService {

    private static final int MAX_PAGE_SIZE = 20; // RNF-01
    private static final LocalDateTime MIN_DATE = LocalDateTime.of(2000, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(2999, 12, 31, 23, 59, 59);

    private final PriceChangeRepository priceChangeRepository;
    private final FlightRepository flightRepository;

    public PriceChangeServiceImpl(PriceChangeRepository priceChangeRepository,
                                  FlightRepository flightRepository) {
        this.priceChangeRepository = priceChangeRepository;
        this.flightRepository = flightRepository;
    }

    /**
     * RNF-01 (previous story): MANDATORY forces this to run inside the calculation transaction,
     * so a price change is never committed without its traceability record.
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<PriceChange> registerIfChanged(Flight flight, long basePrice, long dynamicPrice,
                                                   List<AppliedAdjustment> adjustments) {
        long previous = priceChangeRepository
                .findTopByFlight_IdFlightOrderByChangedAtDesc(flight.getIdFlight())
                .map(PriceChange::getDynamicPrice)
                .orElse(basePrice);

        if (previous == dynamicPrice) {
            return Optional.empty();
        }
        return Optional.of(priceChangeRepository.save(
                new PriceChange(flight, basePrice, dynamicPrice, adjustments)));
    }

    // RF-01, RF-02, RF-04, RNF-01 (this story), Scenario 1, 3, 4
    @Override
    @Transactional(readOnly = true)
    public PriceHistoryPageResponse getHistory(String flightId, LocalDate from, LocalDate to,
                                               int page, int size) {
        ensureFlightExists(flightId);
        LocalDateTime start = startOf(from);
        LocalDateTime end = endOf(to);
        validateRange(start, end);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "changedAt"));

        Page<PriceChange> result = priceChangeRepository
                .findByFlight_IdFlightAndChangedAtBetween(flightId, start, end, pageable);

        List<PriceChangeSummaryResponse> content = result.getContent().stream()
                .map(pc -> new PriceChangeSummaryResponse(
                        pc.getId(), pc.getBasePrice(), pc.getDynamicPrice(), pc.getChangedAt()))
                .toList();

        String message = result.getTotalElements() == 0
                ? "No existen cambios de precio registrados para este vuelo"
                  + (from != null || to != null ? " en el período seleccionado" : "")
                : null;

        return new PriceHistoryPageResponse(flightId, content, result.getNumber(),
                result.getSize(), result.getTotalElements(), result.getTotalPages(), message);
    }

    // RF-03, Scenario 2
    @Override
    @Transactional(readOnly = true)
    public PriceChangeResponse getById(UUID id) {
        return priceChangeRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Price change not found: " + id));
    }

    // RF-05, Scenario 5
    @Override
    @Transactional(readOnly = true)
    public PriceEvolutionResponse getEvolution(String flightId, LocalDate from, LocalDate to) {
        ensureFlightExists(flightId);
        LocalDateTime start = startOf(from);
        LocalDateTime end = endOf(to);
        validateRange(start, end);

        List<PriceEvolutionPoint> points = priceChangeRepository
                .findByFlight_IdFlightAndChangedAtBetweenOrderByChangedAtAsc(flightId, start, end)
                .stream()
                .map(pc -> new PriceEvolutionPoint(pc.getChangedAt(), pc.getBasePrice(), pc.getDynamicPrice()))
                .toList();

        boolean available = points.size() >= 2;
        String message = available ? null
                : "Se requieren al menos dos registros para mostrar la evolución de precios";
        return new PriceEvolutionResponse(flightId, available, points, message);
    }

    private void ensureFlightExists(String flightId) {
        if (!flightRepository.existsById(flightId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found: " + flightId);
        }
    }

    private LocalDateTime startOf(LocalDate from) {
        return from == null ? MIN_DATE : from.atStartOfDay();
    }

    private LocalDateTime endOf(LocalDate to) {
        return to == null ? MAX_DATE : to.atTime(LocalTime.MAX);
    }

    private void validateRange(LocalDateTime start, LocalDateTime end) {
        if (start.isAfter(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha inicial no puede ser posterior a la fecha final");
        }
    }

    private PriceChangeResponse toResponse(PriceChange pc) {
        List<PriceChangeRuleResponse> rules = pc.getAppliedRules().stream()
                .map(r -> new PriceChangeRuleResponse(r.getRuleId(), r.getRuleName(),
                        r.getAdjustmentType(), r.getPercentage(),
                        r.getPriceBefore(), r.getPriceAfter()))
                .toList();
        return new PriceChangeResponse(pc.getId(), pc.getFlight().getIdFlight(),
                pc.getBasePrice(), pc.getDynamicPrice(), pc.getChangedAt(), rules);
    }
}