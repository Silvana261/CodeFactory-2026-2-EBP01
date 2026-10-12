package com.aerodynamic.aerodynamic.pricing_engine.dto;

import java.util.List;

public class FlightEvaluationResponse {

    private String flightId;
    private List<RuleEvaluationResult> evaluations;
    private List<Long> applicableRuleIds;
    private String message;

    public FlightEvaluationResponse() {}

    public FlightEvaluationResponse(String flightId,
                                    List<RuleEvaluationResult> evaluations,
                                    List<Long> applicableRuleIds,
                                    String message) {
        this.flightId = flightId;
        this.evaluations = evaluations;
        this.applicableRuleIds = applicableRuleIds;
        this.message = message;
    }

    // Getters and Setters
    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }

    public List<RuleEvaluationResult> getEvaluations() { return evaluations; }
    public void setEvaluations(List<RuleEvaluationResult> evaluations) { this.evaluations = evaluations; }

    public List<Long> getApplicableRuleIds() { return applicableRuleIds; }
    public void setApplicableRuleIds(List<Long> applicableRuleIds) { this.applicableRuleIds = applicableRuleIds; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}