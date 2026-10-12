package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.FlightResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.repository.FlightRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.FlightService;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlightServiceImpl implements FlightService {

    private final FlightRepository flightRepository;

    // Fixed default minimum fare to protect airlines
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

    @Override
    public List<FlightResponse> getAllFlights() {
        return flightRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FlightResponse mapToResponse(Flight flight) {
        return new FlightResponse(
                flight.getIdFlight(),
                flight.getOrigin(),
                flight.getDestination(),
                flight.getDepartureAt(),
                flight.getBasePrice(),
                flight.getMinimumFare(),
                flight.getCapacity(),
                flight.getAvailability()
        );
    }
}