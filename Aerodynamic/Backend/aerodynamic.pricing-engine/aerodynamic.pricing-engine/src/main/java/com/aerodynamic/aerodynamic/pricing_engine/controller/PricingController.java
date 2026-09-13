package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.service.PricingRuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller responsible for handling pricing rule requests.
 * Provides endpoints for creating and retrieving pricing rules.
 */
@RestController
@RequestMapping("/api/pricing-rules")
public class PricingController {

    private final PricingRuleService pricingRuleService;

    /**
     * Creates an instance of PricingController with the required pricing rule service.
     *
     * @param pricingRuleService service used to handle pricing rule operations
     */
    public PricingController(PricingRuleService pricingRuleService) {
        this.pricingRuleService = pricingRuleService;
    }

    /**
     * Creates a new pricing rule using the provided information.
     *
     * @param request object containing the pricing rule information
     * @return a ResponseEntity containing the created pricing rule
     */
    @PostMapping
    public ResponseEntity<PricingRuleResponse> createPricingRule(
            @Valid @RequestBody PricingRuleRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(pricingRuleService.createPricingRule(request));
    }

    /**
     * Retrieves all registered pricing rules.
     *
     * @return a ResponseEntity containing the list of pricing rules
     */
    @GetMapping
    public ResponseEntity<List<PricingRuleResponse>> getAllPricingRules() {

        return ResponseEntity.ok(
                pricingRuleService.getAllPricingRules());
    }

    /**
     * Retrieves pricing rules filtered by their status.
     *
     * @param status status used to filter the pricing rules
     * @return a ResponseEntity containing the list of matching pricing rules
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PricingRuleResponse>> getPricingRulesByStatus(
            @PathVariable StatusRule status) {

        return ResponseEntity.ok(
                pricingRuleService.getPricingRulesByStatus(status));
    }
}
