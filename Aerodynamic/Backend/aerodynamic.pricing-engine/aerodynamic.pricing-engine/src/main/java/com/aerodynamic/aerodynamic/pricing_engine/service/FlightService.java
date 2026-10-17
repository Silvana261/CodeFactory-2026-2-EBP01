package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightResponse;
import java.util.List;

public interface FlightService {
    FlightResponse createFlight(FlightRequest request);
    List<FlightResponse> getAllFlights();
}
