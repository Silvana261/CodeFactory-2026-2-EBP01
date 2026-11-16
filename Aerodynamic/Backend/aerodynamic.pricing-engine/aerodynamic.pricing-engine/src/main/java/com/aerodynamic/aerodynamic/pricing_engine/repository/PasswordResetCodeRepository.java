package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.PasswordResetCode;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    // Latest code ever generated for the user (used for the resend cooldown)
    Optional<PasswordResetCode> findFirstByUserOrderByCreatedAtDesc(User user);

    // Latest code that can still be used
    Optional<PasswordResetCode> findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(User user);

    // All codes still usable (to invalidate them when a new one is issued)
    List<PasswordResetCode> findByUserAndConsumedFalse(User user);
}
