package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.City;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class FlightRequest {

    @NotBlank(message = "Flight code is mandatory")
    private String idFlight;

    @NotNull(message = "Origin is mandatory")
    private City origin;

    @NotNull(message = "Destination is mandatory")
    private City destination;

    @NotNull(message = "Departure date and time are mandatory")
    private LocalDateTime departureAt;

    @NotNull(message = "Base price is mandatory")
    @DecimalMin(value = "0.01", message = "Base price must be greater than zero")
    private Double basePrice;

    @NotNull(message = "Capacity is mandatory")
    @Min(value = 1, message = "Capacity must be greater than 0")
    private Integer capacity;

    @NotNull(message = "Availability is mandatory")
    @Min(value = 0, message = "Availability cannot be negative")
    private Integer availability;

    // Getters and Setters
    public String getIdFlight() { return idFlight; }
    public void setIdFlight(String idFlight) { this.idFlight = idFlight; }

    public City getOrigin() { return origin; }
    public void setOrigin(City origin) { this.origin = origin; }

    public City getDestination() { return destination; }
    public void setDestination(City destination) { this.destination = destination; }

    public LocalDateTime getDepartureAt() { return departureAt; }
    public void setDepartureAt(LocalDateTime departureAt) { this.departureAt = departureAt; }

    public Double getBasePrice() { return basePrice; }
    public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Integer getAvailability() { return availability; }
    public void setAvailability(Integer availability) { this.availability = availability; }
}
