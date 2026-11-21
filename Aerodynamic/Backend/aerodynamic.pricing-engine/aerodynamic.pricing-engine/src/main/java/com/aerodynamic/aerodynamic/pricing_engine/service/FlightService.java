package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightUpdateRequest;

import java.util.List;

public interface FlightService {

    FlightResponse createFlight(FlightRequest request);

    List<FlightResponse> getAllFlights();

    /** Current data of one flight (used to preload the update form and to re-check after saving). */
    FlightResponse getFlightById(String idFlight);

    /** Updates the editable fields of a registered flight. */
    FlightResponse updateFlight(String idFlight, FlightUpdateRequest request);
}