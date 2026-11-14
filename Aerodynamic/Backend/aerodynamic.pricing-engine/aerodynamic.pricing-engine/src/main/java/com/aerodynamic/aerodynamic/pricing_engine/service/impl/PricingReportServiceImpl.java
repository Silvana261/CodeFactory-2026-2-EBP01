package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.ComparisonPoint;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.Filters;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.Indicators;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.PriceComparisonChart;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.VariableImpactChart;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse.VariableImpactItem;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.BussinessVariable;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PricingReportRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingReportService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PricingReportServiceImpl implements PricingReportService {

    private static final LocalDateTime MIN_DATE = LocalDateTime.of(2000, 1, 1, 0, 0);
    private static final LocalDateTime MAX_DATE = LocalDateTime.of(2999, 12, 31, 23, 59, 59);

    private static final String NO_DATA_MESSAGE =
            "No hay información disponible para el período consultado";
    private static final String NOT_ENOUGH_FOR_CHART_MESSAGE =
            "No hay datos suficientes para generar la gráfica de evolución";
    private static final String NO_RULES_MESSAGE =
            "No hay ajustes por regla registrados para el período consultado";

    private final PricingReportRepository reportRepository;
    private final FlightRepository flightRepository;

    public PricingReportServiceImpl(PricingReportRepository reportRepository,
                                    FlightRepository flightRepository) {
        this.reportRepository = reportRepository;
        this.flightRepository = flightRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PricingReportResponse generate(String flightId, LocalDate from, LocalDate to) {
        String fid = (flightId == null || flightId.isBlank()) ? null : flightId.trim();
        if (fid != null && !flightRepository.existsById(fid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found: " + fid);
        }
        LocalDateTime start = from == null ? MIN_DATE : from.atStartOfDay();
        LocalDateTime end = to == null ? MAX_DATE : to.atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha inicial no puede ser posterior a la fecha final");
        }

        Filters filters = new Filters(fid, from, to);

        // Scenario 2: general indicators
        Object[] row = reportRepository.indicators(fid, start, end).get(0);
        long changes = ((Number) row[0]).longValue();
        long flights = ((Number) row[1]).longValue();
        double avgVariation = row[2] == null ? 0.0 : round2(((Number) row[2]).doubleValue());
        Indicators indicators = new Indicators(flights, changes, avgVariation);

        // Scenario 6: no records at all -> empty indicators and empty charts
        if (changes == 0) {
            return new PricingReportResponse(filters, false, NO_DATA_MESSAGE, indicators,
                    emptyComparison(NO_DATA_MESSAGE),
                    emptyImpact(NO_DATA_MESSAGE));
        }

        return new PricingReportResponse(filters, true, null, indicators,
                buildComparison(fid, start, end),
                buildImpact(fid, start, end));
    }

    // Scenario 3 and 7
    private PriceComparisonChart buildComparison(String fid, LocalDateTime start, LocalDateTime end) {
        List<ComparisonPoint> points = new ArrayList<>();
        for (Object[] r : reportRepository.dailyPrices(fid, start, end)) {
            points.add(new ComparisonPoint(toLocalDate(r[0]),
                    round2(((Number) r[1]).doubleValue()),
                    round2(((Number) r[2]).doubleValue()),
                    ((Number) r[3]).longValue()));
        }
        boolean available = points.size() >= 2;
        return new PriceComparisonChart(
                "Evolución del precio base vs. precio dinámico", "Fecha", "Precio promedio",
                available, available ? null : NOT_ENOUGH_FOR_CHART_MESSAGE,
                available ? points : List.of());
    }

    // Scenario 4: every business variable appears, even with zero adjustments
    private VariableImpactChart buildImpact(String fid, LocalDateTime start, LocalDateTime end) {
        Map<String, VariableImpactItem> items = new LinkedHashMap<>();
        for (BussinessVariable v : BussinessVariable.values()) {
            items.put(v.name(), new VariableImpactItem(v.name(), 0, 0, 0.0));
        }
        long totalRules = 0;
        for (Object[] r : reportRepository.variableImpact(fid, start, end)) {
            String variable = (String) r[0];
            long count = ((Number) r[1]).longValue();
            totalRules += count;
            items.put(variable, new VariableImpactItem(variable, count,
                    ((Number) r[2]).longValue(), round2(((Number) r[3]).doubleValue())));
        }
        boolean available = totalRules > 0;
        return new VariableImpactChart(
                "Impacto de los ajustes por variable de pricing", "Variable de pricing",
                "Ajuste acumulado", available, available ? null : NO_RULES_MESSAGE,
                available ? new ArrayList<>(items.values()) : List.of());
    }

    private PriceComparisonChart emptyComparison(String message) {
        return new PriceComparisonChart("Evolución del precio base vs. precio dinámico",
                "Fecha", "Precio promedio", false, message, List.of());
    }

    private VariableImpactChart emptyImpact(String message) {
        return new VariableImpactChart("Impacto de los ajustes por variable de pricing",
                "Variable de pricing", "Ajuste acumulado", false, message, List.of());
    }

    private LocalDate toLocalDate(Object value) {
        if (value instanceof LocalDate d) return d;
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        if (value instanceof LocalDateTime d) return d.toLocalDate();
        throw new IllegalStateException("Unexpected date type: " + value.getClass());
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}