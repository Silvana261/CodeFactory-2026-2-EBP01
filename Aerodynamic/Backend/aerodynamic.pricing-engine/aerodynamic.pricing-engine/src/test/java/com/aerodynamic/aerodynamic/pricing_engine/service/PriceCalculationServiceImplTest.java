package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.PriceCalculationResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.Flight;
import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.AdjustmentType;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PriceCalculationServiceImplTest {

    private final PriceCalculationServiceImpl service =
            new PriceCalculationServiceImpl(null, null, null);

    private Flight flight(double basePrice, double minimumFare) {
        Flight f = new Flight();
        f.setIdFlight("AD204");
        f.setBasePrice(basePrice);
        f.setMinimumFare(minimumFare);
        return f;
    }

    private PricingRule rule(long id, AdjustmentType type, double pct) {
        PricingRule r = new PricingRule();
        ReflectionTestUtils.setField(r, "idRule", id); // PricingRule has no setter for the id
        r.setRuleName("Rule " + id);
        r.setAdjustmentType(type);
        r.setAdjustmentValue(pct);
        r.setStatus(StatusRule.ACTIVE);
        return r;
    }

    @Test // CA02
    void appliesPercentageIncrease() {
        PriceCalculationResponse r = service.calculate(flight(285000, 200000),
                List.of(rule(1, AdjustmentType.INCREASE_VALUE, 15)));
        assertEquals(327750L, r.getDynamicPrice());
        assertEquals(285000L, r.getBasePrice());
        assertTrue(r.isAdjustmentsApplied());
    }

    @Test // CA03
    void appliesPercentageDecrease() {
        PriceCalculationResponse r = service.calculate(flight(340000, 200000),
                List.of(rule(1, AdjustmentType.DECREASE_VALUE, 10)));
        assertEquals(306000L, r.getDynamicPrice());
    }

    @Test // successive rules: 285000 +15% = 327750, then -10% = 294975
    void appliesSeveralRulesSuccessively() {
        PriceCalculationResponse r = service.calculate(flight(285000, 200000),
                List.of(rule(2, AdjustmentType.DECREASE_VALUE, 10),
                        rule(1, AdjustmentType.INCREASE_VALUE, 15)));
        assertEquals(294975L, r.getDynamicPrice());
        assertEquals(2, r.getAdjustments().size());
        assertEquals(1L, r.getAdjustments().get(0).getRuleId()); // ordered by id
        assertEquals(327750L, r.getAdjustments().get(0).getPriceAfter());
    }

    @Test // CA04
    void keepsBasePriceWhenNoRuleApplies() {
        PriceCalculationResponse r = service.calculate(flight(285000, 200000), List.of());
        assertEquals(285000L, r.getDynamicPrice());
        assertFalse(r.isAdjustmentsApplied());
        assertTrue(r.getAdjustments().isEmpty());
    }

    @Test
    void neverGoesBelowMinimumFare() {
        PriceCalculationResponse r = service.calculate(flight(100000, 60000),
                List.of(rule(1, AdjustmentType.DECREASE_VALUE, 50),
                        rule(2, AdjustmentType.DECREASE_VALUE, 50)));
        assertEquals(60000L, r.getDynamicPrice());
        assertTrue(r.isMinimumFareApplied());
    }

    @Test
    void doesNotModifyStoredBasePrice() { // RNF03
        Flight f = flight(285000, 200000);
        service.calculate(f, List.of(rule(1, AdjustmentType.INCREASE_VALUE, 15)));
        assertEquals(285000.0, f.getBasePrice());
    }
}
