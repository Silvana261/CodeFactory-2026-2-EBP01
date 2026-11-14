package com.aerodynamic.aerodynamic.pricing_engine.dto;

public record PriceChangeRuleResponse(
        Long ruleId, String ruleName, String adjustmentType,
        Double percentage, Long priceBefore, Long priceAfter) {
}
