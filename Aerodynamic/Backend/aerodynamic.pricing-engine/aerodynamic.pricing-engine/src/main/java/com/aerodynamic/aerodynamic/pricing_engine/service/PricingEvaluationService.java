package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightEvaluationResponse;

public interface PricingEvaluationService {
    FlightEvaluationResponse evaluate(String flightId);
}