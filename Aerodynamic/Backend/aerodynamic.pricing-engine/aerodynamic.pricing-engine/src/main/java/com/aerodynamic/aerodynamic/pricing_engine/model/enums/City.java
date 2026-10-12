package com.aerodynamic.aerodynamic.pricing_engine.model.enums;

public enum City {
    BOG("Bogotá"),
    MDE("Medellín"),
    CLO("Cali"),
    CTG("Cartagena"),
    BAQ("Barranquilla");

    private final String displayName;

    City(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
