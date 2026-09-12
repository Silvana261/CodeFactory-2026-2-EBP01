package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.BussinessVariable;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.ConditionOperator;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.AdjustmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PricingRuleRequest {

    // Name of the pricing rule.
    @NotBlank(message = "Rule name is required")
    private String ruleName;

    // Business variable used by the pricing rule.
    @NotNull(message = "Business variable is required")
    private BussinessVariable bussinessVariable;

    // Operator used to evaluate the condition.
    @NotNull(message = "Condition operator is required")
    private ConditionOperator conditionOperator;

    // Value used in the condition.
    @NotNull(message = "Condition value is required")
    private Double conditionValue;

    // Type of adjustment that will be applied to the price.
    @NotNull(message = "Adjustment type is required")
    private AdjustmentType adjustmentType;

    // Value of the price adjustment.
    @NotNull(message = "Adjustment value is required")
    private Double adjustmentValue;

    // Empty constructor.
    public PricingRuleRequest() {
    }

    // Returns the rule name.
    public String getRuleName() {
        return ruleName;
    }

    // Sets the rule name.
    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    // Returns the business variable.
    public BussinessVariable getBussinessVariable() {
        return bussinessVariable;
    }

    // Sets the business variable.
    public void setBussinessVariable(BussinessVariable bussinessVariable) {
        this.bussinessVariable = bussinessVariable;
    }

    // Returns the condition operator.
    public ConditionOperator getConditionOperator() {
        return conditionOperator;
    }

    // Sets the condition operator.
    public void setConditionOperator(ConditionOperator conditionOperator) {
        this.conditionOperator = conditionOperator;
    }

    // Returns the condition value.
    public Double getConditionValue() {
        return conditionValue;
    }

    // Sets the condition value.
    public void setConditionValue(Double conditionValue) {
        this.conditionValue = conditionValue;
    }

    // Returns the adjustment type.
    public AdjustmentType getAdjustmentType() {
        return adjustmentType;
    }

    // Sets the adjustment type.
    public void setAdjustmentType(AdjustmentType adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    // Returns the adjustment value.
    public Double getAdjustmentValue() {
        return adjustmentValue;
    }

    // Sets the adjustment value.
    public void setAdjustmentValue(Double adjustmentValue) {
        this.adjustmentValue = adjustmentValue;
    }
}