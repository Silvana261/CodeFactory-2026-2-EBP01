package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightUpdateRequest;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.FlightService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlightServiceImpl implements FlightService {

    private final FlightRepository flightRepository;

    // Fixed default minimum fare to protect airlines (internal, never exposed to the client)
    private static final double DEFAULT_MINIMUM_FARE = 80000.0;

    public FlightServiceImpl(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @Override
    public FlightResponse createFlight(FlightRequest request) {
        // RF05: Prevent duplicate flight codes
        if (flightRepository.existsById(request.getIdFlight())) {
            throw new IllegalArgumentException("Flight code already registered: " + request.getIdFlight());
        }

        // RF06: Validate base price greater than zero
        if (request.getBasePrice() == null || request.getBasePrice() <= 0) {
            throw new IllegalArgumentException("Base price must be greater than zero");
        }

        // Map request DTO to entity
        Flight flight = new Flight();
        flight.setIdFlight(request.getIdFlight());
        flight.setOrigin(request.getOrigin());
        flight.setDestination(request.getDestination());
        flight.setDepartureAt(request.getDepartureAt());
        flight.setBasePrice(request.getBasePrice());
        flight.setMinimumFare(DEFAULT_MINIMUM_FARE); // Assign standard minimum fare internally
        flight.setCapacity(request.getCapacity());
        flight.setAvailability(request.getAvailability());

        // Save to database
        Flight savedFlight = flightRepository.save(flight);

        return mapToResponse(savedFlight);
    }

    /**
     * Retrieves all registered flights to supply the pricing engine and frontend table.
     */
    @Override
    public List<FlightResponse> getAllFlights() {
        return flightRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Scenario 1 and 4: current data of one flight
    @Override
    @Transactional(readOnly = true)
    public FlightResponse getFlightById(String idFlight) {
        return mapToResponse(findOrThrow(idFlight));
    }

    // Scenario 2 and 3: validate, then persist the editable fields
    @Override
    @Transactional
    public FlightResponse updateFlight(String idFlight, FlightUpdateRequest request) {
        Flight flight = findOrThrow(idFlight);

        validateBusinessRules(request);

        // idFlight (PK) and minimumFare (internal) are intentionally never modified
        flight.setOrigin(request.getOrigin());
        flight.setDestination(request.getDestination());
        flight.setDepartureAt(request.getDepartureAt());
        flight.setBasePrice(request.getBasePrice());
        flight.setCapacity(request.getCapacity());
        flight.setAvailability(request.getAvailability());

        return mapToResponse(flightRepository.save(flight));
    }

    // Cross-field rules that Bean Validation on single fields cannot express
    private void validateBusinessRules(FlightUpdateRequest request) {
        if (request.getOrigin() == request.getDestination()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Destination must be different from origin");
        }
        if (request.getAvailability() > request.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Availability cannot exceed capacity");
        }
    }

    private Flight findOrThrow(String idFlight) {
        return flightRepository.findById(idFlight)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flight not found: " + idFlight));
    }

    // Helper method to map Entity to Response DTO (minimumFare is intentionally not exposed)
    private FlightResponse mapToResponse(Flight flight) {
        return new FlightResponse(
                flight.getIdFlight(),
                flight.getOrigin(),
                flight.getDestination(),
                flight.getDepartureAt(),
                flight.getBasePrice(),
                flight.getCapacity(),
                flight.getAvailability()
        );
    }
}