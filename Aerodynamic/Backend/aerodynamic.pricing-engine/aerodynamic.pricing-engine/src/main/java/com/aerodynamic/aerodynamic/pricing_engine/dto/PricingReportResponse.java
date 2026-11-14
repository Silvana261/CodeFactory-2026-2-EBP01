package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Whole dashboard in one response: indicators and charts come from the same
 * filters and the same query set (RNF-04). Charts carry title and axis labels (RNF-02).
 */
public record PricingReportResponse(
        Filters filters,
        boolean hasData,
        String message,
        Indicators indicators,
        PriceComparisonChart priceComparison,
        VariableImpactChart variableImpact) {

    public record Filters(String flightId, LocalDate from, LocalDate to) {}

    public record Indicators(long flightsAnalyzed, long priceChanges, double averageVariationPercent) {}

    public record PriceComparisonChart(
            String title, String xAxisLabel, String yAxisLabel,
            boolean available, String message, List<ComparisonPoint> points) {}

    public record ComparisonPoint(
            LocalDate date, double averageBasePrice, double averageDynamicPrice, long changes) {}

    public record VariableImpactChart(
            String title, String xAxisLabel, String yAxisLabel,
            boolean available, String message, List<VariableImpactItem> items) {}

    public record VariableImpactItem(
            String variable, long rulesApplied, long totalAdjustment, double averageAdjustment) {}
}