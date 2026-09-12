package com.aerodynamic.aerodynamic.pricing_engine.model.enums;

public enum RuleCondition {

    GREATER_THAN_OR_EQUAL(">="),
    LESS_THAN_OR_EQUAL("<="),
    GREATER_THAN(">"),
    LESS_THAN("<");

    private final String symbol;

    // Enum constructor to associate each option with their corresponding symbol in text
    RuleCondition(String symbol) {
        this.symbol = symbol;
    }

    public String getSymbol() {
        return symbol;
    }
}
