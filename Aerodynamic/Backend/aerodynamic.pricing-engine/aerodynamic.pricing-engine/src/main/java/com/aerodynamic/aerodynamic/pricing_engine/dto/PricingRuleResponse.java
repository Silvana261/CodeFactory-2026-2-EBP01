package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.AdjustmentType;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.BussinessVariable;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.ConditionOperator;

public class PricingRuleResponse {
    
    private Long idRule;
    private String ruleName;
    private BussinessVariable bussinessVariable;
    private ConditionOperator conditionOperator;
    private Double conditionValue;
    private AdjustmentType adjustmentType;
    private Double adjustmentValue;
    private StatusRule status;
    private Long creatorUserId;

    // Empty constructor
    public PricingRuleResponse() {
    }

    // useful for quick mapping
    public PricingRuleResponse(Long idRule, String ruleName, BussinessVariable bussinessVariable, ConditionOperator conditionOperator, Double conditionValue, AdjustmentType adjustmentType, Double adjustmentValue, StatusRule status, Long creatorUserId) {
        this.idRule = idRule;
        this.ruleName = ruleName;
        this.bussinessVariable = bussinessVariable;
        this.conditionOperator = conditionOperator;
        this.conditionValue = conditionValue;
        this.adjustmentType = adjustmentType;
        this.adjustmentValue = adjustmentValue;
        this.status = status;
        this.creatorUserId = creatorUserId;
    }

    // Getters and Setters
    public Long getIdRule() {
        return idRule;
    }

    public void setIdRule(Long idRule) {
        this.idRule = idRule;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public BussinessVariable getBussinessVariable() {
        return bussinessVariable;
    }

    public void setBussinessVariable(BussinessVariable bussinessVariable) {
        this.bussinessVariable = bussinessVariable;
    }

    public ConditionOperator getConditionOperator() {
        return conditionOperator;
    }

    public void setConditionOperator(ConditionOperator conditionOperator) {
        this.conditionOperator = conditionOperator;
    }

    public Double getConditionValue() {
        return conditionValue;
    }

    public void setConditionValue(Double conditionValue) {
        this.conditionValue = conditionValue;
    }

    public AdjustmentType getAdjustmentType() {
        return adjustmentType;
    }

    public void setAdjustmentType(AdjustmentType adjustmentType) {
        this.adjustmentType = adjustmentType;
    }

    public Double getAdjustmentValue() {
        return adjustmentValue;
    }

    public void setAdjustmentValue(Double adjustmentValue) {
        this.adjustmentValue = adjustmentValue;
    }

    public StatusRule getStatus() {
        return status;
    }

    public void setStatus(StatusRule status) {
        this.status = status;
    }

    public Long getCreatorUserId() {
        return creatorUserId;
    }

    public void setCreatorUserId(Long creatorUserId) {
        this.creatorUserId = creatorUserId;
    }
}
