package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.PriceChange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PriceChangeRepository extends JpaRepository<PriceChange, UUID> {

    Optional<PriceChange> findTopByFlight_IdFlightOrderByChangedAtDesc(String idFlight);

    // Paginated history, filtered by date range (uses index flight_id + changed_at)
    Page<PriceChange> findByFlight_IdFlightAndChangedAtBetween(
            String idFlight, LocalDateTime from, LocalDateTime to, Pageable pageable);

    // Full series in range, oldest first, for the evolution chart
    List<PriceChange> findByFlight_IdFlightAndChangedAtBetweenOrderByChangedAtAsc(
            String idFlight, LocalDateTime from, LocalDateTime to);
}