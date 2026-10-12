package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlightRepository extends JpaRepository<Flight, String> {
}