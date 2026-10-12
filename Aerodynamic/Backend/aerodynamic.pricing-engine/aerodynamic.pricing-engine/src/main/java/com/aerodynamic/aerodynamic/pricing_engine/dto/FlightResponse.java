package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.City;
import java.time.LocalDateTime;

public class FlightResponse {
    private String idFlight;
    private City origin;
    private City destination;
    private LocalDateTime departureAt;
    private Double basePrice;
    private Double minimumFare;
    private Integer capacity;
    private Integer availability;

    public FlightResponse(String idFlight, City origin, City destination, LocalDateTime departureAt, Double basePrice, Double minimumFare, Integer capacity, Integer availability) {
        this.idFlight = idFlight;
        this.origin = origin;
        this.destination = destination;
        this.departureAt = departureAt;
        this.basePrice = basePrice;
        this.minimumFare = minimumFare;
        this.capacity = capacity;
        this.availability = availability;
    }

    // Getters
    public String getIdFlight() { return idFlight; }
    public City getOrigin() { return origin; }
    public City getDestination() { return destination; }
    public LocalDateTime getDepartureAt() { return departureAt; }
    public Double getBasePrice() { return basePrice; }
    public Double getMinimumFare() { return minimumFare; }
    public Integer getCapacity() { return capacity; }
    public Integer getAvailability() { return availability; }
}
