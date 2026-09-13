package com.aerodynamic.aerodynamic.pricing_engine.service;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.PricingRuleResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;

import java.util.List;
public interface PricingRuleService {
    PricingRuleResponse createPricingRule(PricingRuleRequest request);
    List<PricingRuleResponse> getAllPricingRules();
    List<PricingRuleResponse> getPricingRulesByStatus(StatusRule status);
}
