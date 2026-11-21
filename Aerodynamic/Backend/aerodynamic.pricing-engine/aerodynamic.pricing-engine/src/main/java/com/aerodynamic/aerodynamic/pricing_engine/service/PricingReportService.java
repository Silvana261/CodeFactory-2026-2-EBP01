package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse;

import java.time.LocalDate;

public interface PricingReportService {

    /** Builds the dashboard for the given filters; all filters are optional. */
    PricingReportResponse generate(String flightId, LocalDate from, LocalDate to);
}