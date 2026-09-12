package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.PricingRule;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.StatusRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository for the PricingRule entity.
 *
 * Extending JpaRepository<PricingRule, Long> automatically provides the
 * standard CRUD operations, with no need to declare them here:
 *
 *   - save(pricingRule)    -> insert or update a pricing rule (CA6)
 *   - findById(id)          -> find a specific rule, e.g. for CA7
 *   - findAll()              -> list all pricing rules
 *   - deleteById(id)        -> delete a pricing rule by its primary key
 *   - existsById(id)        -> check if a pricing rule exists by its primary key
 *   - count()               -> count total pricing rules
 *
 * Only methods that Spring Data JPA cannot infer automatically
 * (i.e. queries on fields other than the id) need to be declared below.
 */
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {

    // Useful for CA7 and for the "Reglas de Pricing" table (filter by Active/Inactive)
    List<PricingRule> findByStatus(StatusRule status);
}