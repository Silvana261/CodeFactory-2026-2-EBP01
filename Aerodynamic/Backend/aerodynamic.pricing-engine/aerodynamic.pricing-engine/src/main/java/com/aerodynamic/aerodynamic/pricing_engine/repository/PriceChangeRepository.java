package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.PriceChange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceChangeRepository extends JpaRepository<PriceChange, UUID> {

    Optional<PriceChange> findTopByFlight_IdFlightOrderByChangedAtDesc(String idFlight);

    List<PriceChange> findByFlight_IdFlightOrderByChangedAtDesc(String idFlight);
}