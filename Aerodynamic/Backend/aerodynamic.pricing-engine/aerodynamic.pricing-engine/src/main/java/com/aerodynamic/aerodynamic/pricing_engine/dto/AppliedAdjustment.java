package com.aerodynamic.aerodynamic.pricing_engine.dto;

/**
 * One pricing rule applied during a price calculation.
 * Gives traceability: which rule, which business variable, what percentage,
 * and how the price changed.
 */
public class AppliedAdjustment {

    private final Long ruleId;
    private final String ruleName;
    private final String adjustmentType;
    private final Double percentage;
    private final Long priceBefore;
    private final Long priceAfter;
    private final String businessVariable;

    public AppliedAdjustment(Long ruleId, String ruleName, String adjustmentType,
                             Double percentage, Long priceBefore, Long priceAfter,
                             String businessVariable) {
        this.ruleId = ruleId;
        this.ruleName = ruleName;
        this.adjustmentType = adjustmentType;
        this.percentage = percentage;
        this.priceBefore = priceBefore;
        this.priceAfter = priceAfter;
        this.businessVariable = businessVariable;
    }

    // Kept so existing callers/tests keep compiling (variable unknown)
    public AppliedAdjustment(Long ruleId, String ruleName, String adjustmentType,
                             Double percentage, Long priceBefore, Long priceAfter) {
        this(ruleId, ruleName, adjustmentType, percentage, priceBefore, priceAfter, null);
    }

    public Long getRuleId() { return ruleId; }
    public String getRuleName() { return ruleName; }
    public String getAdjustmentType() { return adjustmentType; }
    public Double getPercentage() { return percentage; }
    public Long getPriceBefore() { return priceBefore; }
    public Long getPriceAfter() { return priceAfter; }
    public String getBusinessVariable() { return businessVariable; }
}