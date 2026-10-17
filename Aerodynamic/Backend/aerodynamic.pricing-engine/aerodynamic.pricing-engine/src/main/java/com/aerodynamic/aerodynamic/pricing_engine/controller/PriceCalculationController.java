package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingMediator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes the dynamic price calculation used by the "Calcular" button.
 */
@RestController
@RequestMapping("/api/flights")
public class PriceCalculationController {

    private final PricingMediator pricingMediator;

    public PriceCalculationController(PricingMediator pricingMediator) {
        this.pricingMediator = pricingMediator;
    }

    /**
     * URL: GET /api/flights/{flightId}/dynamic-price
     */
    @GetMapping("/{flightId}/dynamic-price")
    public ResponseEntity<PriceCalculationResponse> calculateDynamicPrice(
            @PathVariable String flightId) {
        return ResponseEntity.ok(pricingMediator.calculatePrice(flightId));
    }
}
