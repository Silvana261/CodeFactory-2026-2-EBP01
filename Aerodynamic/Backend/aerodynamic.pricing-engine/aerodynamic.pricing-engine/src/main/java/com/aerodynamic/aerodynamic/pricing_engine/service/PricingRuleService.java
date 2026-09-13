package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PricingRuleRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PricingRuleService {

    @Autowired
    private PricingRuleRepository pricingRuleRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Creates a new pricing rule from the request DTO data.
     */
    public PricingRuleResponse createPricingRule(PricingRuleRequest request) {
        // 1. Find the creator user in the database using the ID from the request
        User creatorUser = userRepository.findById(request.getCreatorUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getCreatorUserId()));

        // 2. Map from the Request DTO to the JPA Entity (PricingRule)
        PricingRule rule = new PricingRule();
        rule.setRuleName(request.getRuleName());
        rule.setBussinessVariable(request.getBussinessVariable());
        rule.setCondition(request.getConditionOperator());
        rule.setConditionValue(request.getConditionValue());
        rule.setAdjustmentType(request.getAdjustmentType());
        rule.setAdjustmentValue(request.getAdjustmentValue());
        rule.setStatus(request.getStatus());
        rule.setCreatorUser(creatorUser);

        // 3. Save to the database using the repository
        PricingRule savedRule = pricingRuleRepository.save(rule);

        // 4. Convert the saved entity to a Response DTO and return it
        return mapToResponse(savedRule);
    }

    /**
     * Retrieves all registered pricing rules and converts them to Response DTOs.
     */
    public List<PricingRuleResponse> getAllPricingRules() {
        return pricingRuleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Searches for rules filtered by their status (using the repository custom method).
     */
    public List<PricingRuleResponse> getPricingRulesByStatus(StatusRule status) {
        return pricingRuleRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Private helper method to centralize the Entity -> Response DTO conversion
     * (Avoids repeating mapping code).
     */
    private PricingRuleResponse mapToResponse(PricingRule rule) {
        return new PricingRuleResponse(
                rule.getIdRule(),
                rule.getRuleName(),
                rule.getBussinessVariable(),
                rule.getConditionOperator(),
                rule.getConditionValue(),
                rule.getAdjustmentType(),
                rule.getAdjustmentValue(),
                rule.getStatus(),
                rule.getCreatorUser() != null ? rule.getCreatorUser().getId() : null
        );
    }
}