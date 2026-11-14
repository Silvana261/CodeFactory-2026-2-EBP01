package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightUpdateRequest;
import com.aerodynamic.aerodynamic.pricing_engine.service.FlightService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightService flightService;

    // Constructor injection for clean architecture
    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    /**
     * Endpoint to register a new flight.
     * URL: POST /api/flights
     */
    @PostMapping
    public ResponseEntity<FlightResponse> createFlight(@Valid @RequestBody FlightRequest request) {
        FlightResponse response = flightService.createFlight(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint GET to fetch all flights for the pricing table and dashboard.
     * URL: GET /api/flights
     */
    @GetMapping
    public ResponseEntity<List<FlightResponse>> getAllFlights() {
        List<FlightResponse> flights = flightService.getAllFlights();
        return ResponseEntity.ok(flights);
    }

    /**
     * Current data of one flight: preloads the update form and shows updated values afterwards.
     * URL: GET /api/flights/{idFlight}
     */
    @GetMapping("/{idFlight}")
    public ResponseEntity<FlightResponse> getFlight(@PathVariable String idFlight) {
        return ResponseEntity.ok(flightService.getFlightById(idFlight));
    }

    /**
     * Updates the editable fields of a registered flight.
     * URL: PUT /api/flights/{idFlight}
     */
    @PutMapping("/{idFlight}")
    public ResponseEntity<FlightResponse> updateFlight(@PathVariable String idFlight,
                                                       @Valid @RequestBody FlightUpdateRequest request) {
        return ResponseEntity.ok(flightService.updateFlight(idFlight, request));
    }
}