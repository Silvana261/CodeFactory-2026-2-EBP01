package com.aerodynamic.aerodynamic.pricing_engine.dto;

public class RuleEvaluationResult {

    private Long ruleId;
    private String ruleName;
    private String variable;
    private Double actualValue;
    private String operator;
    private Double expectedValue;
    private boolean met;
    private boolean ruleActive;
    private String adjustmentType;
    private Double adjustmentValue;
    private String note;

    public RuleEvaluationResult() {}

    public RuleEvaluationResult(Long ruleId, String ruleName, String variable,
                                Double actualValue, String operator,
                                Double expectedValue, boolean met,
                                boolean ruleActive, String adjustmentType,
                                Double adjustmentValue, String note) {
        this.ruleId = ruleId;
        this.ruleName = ruleName;
        this.variable = variable;
        this.actualValue = actualValue;
        this.operator = operator;
        this.expectedValue = expectedValue;
        this.met = met;
        this.ruleActive = ruleActive;
        this.adjustmentType = adjustmentType;
        this.adjustmentValue = adjustmentValue;
        this.note = note;
    }

    public Long getRuleId() { return ruleId; }
    public void setRuleId(Long ruleId) { this.ruleId = ruleId; }

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }

    public String getVariable() { return variable; }
    public void setVariable(String variable) { this.variable = variable; }

    public Double getActualValue() { return actualValue; }
    public void setActualValue(Double actualValue) { this.actualValue = actualValue; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public Double getExpectedValue() { return expectedValue; }
    public void setExpectedValue(Double expectedValue) { this.expectedValue = expectedValue; }

    public boolean isMet() { return met; }
    public void setMet(boolean met) { this.met = met; }

    public boolean isRuleActive() { return ruleActive; }
    public void setRuleActive(boolean ruleActive) { this.ruleActive = ruleActive; }

    public String getAdjustmentType() { return adjustmentType; }
    public void setAdjustmentType(String adjustmentType) { this.adjustmentType = adjustmentType; }

    public Double getAdjustmentValue() { return adjustmentValue; }
    public void setAdjustmentValue(Double adjustmentValue) { this.adjustmentValue = adjustmentValue; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}