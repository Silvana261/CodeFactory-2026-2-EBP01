package com.aerodynamic.aerodynamic.pricing_engine.model;

import com.aerodynamic.aerodynamic.pricing_engine.dto.AppliedAdjustment;
import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Immutable record of one dynamic price change for a flight.
 * RF-02/03/05: linked to the flight, keeps base price and dynamic price separately.
 * RNF-02: no setters and @Immutable, so ordinary operations cannot modify it.
 * RNF-03: unique UUID identifier.
 */
@Entity
@Immutable
@Table(name = "price_changes",
       indexes = @Index(name = "idx_price_change_flight_date", columnList = "flight_id, changedAt"))
public class PriceChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false, updatable = false)
    private Flight flight;

    @Column(nullable = false, updatable = false)
    private Long basePrice;

    @Column(nullable = false, updatable = false)
    private Long dynamicPrice;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @OneToMany(mappedBy = "priceChange", cascade = CascadeType.PERSIST)
    @OrderBy("applicationOrder ASC")
    private List<PriceChangeRule> appliedRules = new ArrayList<>();

    protected PriceChange() {}

    public PriceChange(Flight flight, Long basePrice, Long dynamicPrice,
                       List<AppliedAdjustment> adjustments) {
        this.flight = flight;
        this.basePrice = basePrice;
        this.dynamicPrice = dynamicPrice;
        this.changedAt = LocalDateTime.now();
        int order = 0;
        for (AppliedAdjustment a : adjustments) {
            this.appliedRules.add(new PriceChangeRule(this, order++, a));
        }
    }

    public UUID getId() { return id; }
    public Flight getFlight() { return flight; }
    public Long getBasePrice() { return basePrice; }
    public Long getDynamicPrice() { return dynamicPrice; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public List<PriceChangeRule> getAppliedRules() { return Collections.unmodifiableList(appliedRules); }
}
