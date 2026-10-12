package com.aerodynamic.aerodynamic.pricing_engine.model;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.City;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
public class Flight {

    @Id
    @Column(unique = true, nullable = false, length = 20)
    private String idFlight; // Operational flight code (e.g., AD731) acting as PK

    @NotNull(message = "Origin is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private City origin;

    @NotNull(message = "Destination is mandatory")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private City destination;

    @NotNull(message = "Departure date and time are mandatory")
    @Column(nullable = false)
    private LocalDateTime departureAt;

    @NotNull(message = "Base price is mandatory")
    @DecimalMin(value = "0.01", message = "Base price must be greater than zero")
    @Column(nullable = false)
    private Double basePrice;

    @Column(nullable = false)
    private Double minimumFare; // Internal baseline fare required by the database model

    @NotNull(message = "Capacity is mandatory")
    @Min(value = 1, message = "Capacity must be at least 1 seat")
    @Column(nullable = false)
    private Integer capacity;

    @NotNull(message = "Availability is mandatory")
    @Min(value = 0, message = "Availability cannot be negative")
    @Column(nullable = false)
    private Integer availability;

    public Flight() {}

    public Flight(String idFlight, City origin, City destination, LocalDateTime departureAt, Double basePrice, Double minimumFare, Integer capacity, Integer availability) {
        this.idFlight = idFlight;
        this.origin = origin;
        this.destination = destination;
        this.departureAt = departureAt;
        this.basePrice = basePrice;
        this.minimumFare = minimumFare;
        this.capacity = capacity;
        this.availability = availability;
    }

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

    public Double getMinimumFare() { return minimumFare; }
    public void setMinimumFare(Double minimumFare) { this.minimumFare = minimumFare; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Integer getAvailability() { return availability; }
    public void setAvailability(Integer availability) { this.availability = availability; }
}