package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingReportResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class PricingReportController {

    private final PricingReportService reportService;

    public PricingReportController(PricingReportService reportService) {
        this.reportService = reportService;
    }

    // Scenarios 1-7: whole dashboard (indicators + charts) for the given filters
    @GetMapping("/pricing")
    public PricingReportResponse pricingReport(
            @RequestParam(required = false) String flightId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportService.generate(flightId, from, to);
    }
}