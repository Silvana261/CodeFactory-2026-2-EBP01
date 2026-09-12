package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.BussinessVariable;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.RuleCondition;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.AdjustmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


// DTO used to receive the information needed to create or update a pricing rule.
public class PricingRuleRequest { 

    // Rule name is required and cannot be null or empty.
    @NotBlank(message = "Rule name is required") 
    private String ruleName; 

    // Business variable to which the rule will be applied.
    // This field is required.
    @NotNull(message = "Business variable is required") 
    private BussinessVariable bussinessVariable; 

    // Condition that determines when the pricing rule should be applied.
    // This field is required.
    @NotNull(message = "Condition is required") 
    private RuleCondition condition; 

    // Value used to evaluate the condition.
    // This field is required.
    @NotNull(message = "Condition value is required") 
    private Double conditionOperator; 

    // Defines how the price adjustment will be applied.
    // This field is required.
    @NotNull(message = "Adjustment type is required") 
    private AdjustmentType adjustmentType; 

    // Value of the price adjustment.
    // This field is required.
    @NotNull(message = "Adjustment value is required") 
    private Double adjustmentValue; 

    // Empty constructor required to create an instance of this DTO.
    public PricingRuleRequest() { 
    } 

    // Returns the name of the pricing rule.
    public String getRuleName() { 
        return ruleName; 
    } 

    // Sets the name of the pricing rule.
    public void setRuleName(String ruleName) { 
        this.ruleName = ruleName; 
    } 

    // Returns the business variable associated with the rule.
    public BussinessVariable getBussinessVariable() { 
        return bussinessVariable; 
    } 

    // Sets the business variable associated with the rule.
    public void setBussinessVariable(BussinessVariable bussinessVariable) { 
        this.bussinessVariable = bussinessVariable; 
    } 

    // Returns the condition of the pricing rule.
    public RuleCondition getCondition() { 
        return condition; 
    } 

    // Sets the condition of the pricing rule.
    public void setCondition(RuleCondition condition) { 
        this.condition = condition; 
    } 

    // Returns the value used to evaluate the condition.
    public Double getConditionOperator() { 
        return conditionOperator; 
    } 

    // Sets the value used to evaluate the condition.
    public void setConditionOperator(Double conditionValue) { 
        this.conditionOperator = conditionValue; 
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

