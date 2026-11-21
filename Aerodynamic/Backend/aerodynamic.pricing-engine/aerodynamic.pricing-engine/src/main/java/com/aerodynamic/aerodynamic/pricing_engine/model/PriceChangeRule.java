package com.aerodynamic.aerodynamic.pricing_engine.model;

import com.aerodynamic.aerodynamic.pricing_engine.dto.AppliedAdjustment;
import jakarta.persistence.*;
import org.hibernate.annotations.Immutable;

import java.util.UUID;

/**
 * Snapshot of a rule applied in a price change.
 * Values are copied (not just a FK) so later edits/deletes of the rule do not alter history.
 */
@Entity
@Immutable
@Table(name = "price_change_rules",
       indexes = @Index(name = "idx_price_change_rule_change", columnList = "price_change_id"))
public class PriceChangeRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "price_change_id", nullable = false, updatable = false)
    private PriceChange priceChange;

    @Column(nullable = false, updatable = false)
    private Integer applicationOrder;

    @Column(updatable = false)
    private Long ruleId;

    @Column(updatable = false)
    private String ruleName;

    // Business variable (demand, availability, temporal context...). Null in records created before this field existed.
    @Column(updatable = false)
    private String businessVariable;

    @Column(updatable = false)
    private String adjustmentType;

    @Column(updatable = false)
    private Double percentage;

    @Column(nullable = false, updatable = false)
    private Long priceBefore;

    @Column(nullable = false, updatable = false)
    private Long priceAfter;

    protected PriceChangeRule() {}

    PriceChangeRule(PriceChange priceChange, int applicationOrder, AppliedAdjustment a) {
        this.priceChange = priceChange;
        this.applicationOrder = applicationOrder;
        this.ruleId = a.getRuleId();
        this.ruleName = a.getRuleName();
        this.businessVariable = a.getBusinessVariable();
        this.adjustmentType = a.getAdjustmentType();
        this.percentage = a.getPercentage();
        this.priceBefore = a.getPriceBefore();
        this.priceAfter = a.getPriceAfter();
    }

    public UUID getId() { return id; }
    public Integer getApplicationOrder() { return applicationOrder; }
    public Long getRuleId() { return ruleId; }
    public String getRuleName() { return ruleName; }
    public String getBusinessVariable() { return businessVariable; }
    public String getAdjustmentType() { return adjustmentType; }
    public Double getPercentage() { return percentage; }
    public Long getPriceBefore() { return priceBefore; }
    public Long getPriceAfter() { return priceAfter; }
}