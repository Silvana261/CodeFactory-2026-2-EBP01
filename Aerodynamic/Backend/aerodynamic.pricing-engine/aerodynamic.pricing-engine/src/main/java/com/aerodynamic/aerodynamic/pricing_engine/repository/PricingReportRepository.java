package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.PriceChange;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Read-only aggregate queries for the pricing dashboard.
 * All three share the same filters (RNF-04) and aggregate in the database (RNF-01).
 */
public interface PricingReportRepository extends Repository<PriceChange, UUID> {

    // [0] changes (Long), [1] distinct flights (Long), [2] avg % variation (Double, null if no rows)
    @Query("""
            select count(pc), count(distinct pc.flight.idFlight),
                   avg((pc.dynamicPrice - pc.basePrice) * 100.0 / pc.basePrice)
            from PriceChange pc
            where pc.changedAt between :from and :to
              and (cast(:flightId as string) is null or pc.flight.idFlight = :flightId)
            """)
    List<Object[]> indicators(@Param("flightId") String flightId,
                              @Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to);

    // [0] day, [1] avg base price, [2] avg dynamic price, [3] changes that day
    @Query("""
            select cast(pc.changedAt as date), avg(pc.basePrice), avg(pc.dynamicPrice), count(pc)
            from PriceChange pc
            where pc.changedAt between :from and :to
              and (cast(:flightId as string) is null or pc.flight.idFlight = :flightId)
            group by cast(pc.changedAt as date)
            order by cast(pc.changedAt as date)
            """)
    List<Object[]> dailyPrices(@Param("flightId") String flightId,
                               @Param("from") LocalDateTime from,
                               @Param("to") LocalDateTime to);

    // [0] business variable, [1] rules applied, [2] total adjustment, [3] average adjustment
    @Query("""
            select coalesce(r.businessVariable, 'SIN_CLASIFICAR'), count(r),
                   sum(r.priceAfter - r.priceBefore), avg(r.priceAfter - r.priceBefore)
            from PriceChangeRule r join r.priceChange pc
            where pc.changedAt between :from and :to
              and (cast(:flightId as string) is null or pc.flight.idFlight = :flightId)
            group by coalesce(r.businessVariable, 'SIN_CLASIFICAR')
            """)
    List<Object[]> variableImpact(@Param("flightId") String flightId,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);
}