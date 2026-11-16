package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.model.PasswordResetCode;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PasswordResetCodeRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.EmailService;
import com.aerodynamic.aerodynamic.pricing_engine.service.PasswordRecoveryService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PasswordRecoveryServiceImpl implements PasswordRecoveryService {

    static final int CODE_VALIDITY_MINUTES = 10;   // RNF-01
    static final int RESEND_COOLDOWN_SECONDS = 60; // a new code can be requested after this time
    static final int MAX_FAILED_ATTEMPTS = 5;      // the code is blocked after this many wrong tries

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder; // ASSUMPTION: a PasswordEncoder bean already exists (used by login)
    private final EmailService emailService;

    public PasswordRecoveryServiceImpl(UserRepository userRepository,
                                       PasswordResetCodeRepository codeRepository,
                                       PasswordEncoder passwordEncoder,
                                       EmailService emailService) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public void requestRecovery(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email.trim());
        if (optionalUser.isEmpty()) {
            return; // RNF-04: the caller gets the same answer either way
        }
        User user = optionalUser.get();
        LocalDateTime now = LocalDateTime.now();

        // Too soon since the last code: do nothing (same answer, no extra email)
        Optional<PasswordResetCode> last = codeRepository.findFirstByUserOrderByCreatedAtDesc(user);
        if (last.isPresent()
                && last.get().getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {
            return;
        }

        // Only the newest code is valid: invalidate previous ones
        List<PasswordResetCode> active = codeRepository.findByUserAndConsumedFalse(user);
        active.forEach(c -> c.setConsumed(true));
        codeRepository.saveAll(active);

        String code = generateCode();
        codeRepository.save(new PasswordResetCode(
                user, passwordEncoder.encode(code), now, now.plusMinutes(CODE_VALIDITY_MINUTES)));
        emailService.sendRecoveryCode(user.getEmail(), user.getName(), code);
    }

    @Override
    @Transactional
    public boolean verifyCode(String email, String code) {
        return findValidCode(email, code).isPresent();
    }

    @Override
    @Transactional
    public boolean resetPassword(String email, String code, String newPassword) {
        Optional<PasswordResetCode> valid = findValidCode(email, code);
        if (valid.isEmpty()) {
            return false;
        }
        PasswordResetCode resetCode = valid.get();

        User user = resetCode.getUser();
        user.setPassword(passwordEncoder.encode(newPassword)); // RNF-03: stored hashed
        userRepository.save(user);

        resetCode.setConsumed(true); // RF-06: the code cannot be used again
        codeRepository.save(resetCode);
        return true;
    }

    /**
     * Returns the code only if it is correct, not expired, not used and not blocked.
     * Wrong attempts are counted here; expired codes are invalidated here.
     */
    private Optional<PasswordResetCode> findValidCode(String email, String code) {
        Optional<User> user = userRepository.findByEmail(email.trim());
        if (user.isEmpty()) {
            return Optional.empty();
        }

        Optional<PasswordResetCode> stored =
                codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(user.get());
        if (stored.isEmpty()) {
            return Optional.empty();
        }
        PasswordResetCode resetCode = stored.get();

        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            resetCode.setConsumed(true);
            codeRepository.save(resetCode);
            return Optional.empty();
        }

        if (!passwordEncoder.matches(code, resetCode.getCodeHash())) {
            resetCode.setFailedAttempts(resetCode.getFailedAttempts() + 1);
            if (resetCode.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                resetCode.setConsumed(true);
            }
            codeRepository.save(resetCode);
            return Optional.empty();
        }
        return Optional.of(resetCode);
    }

    // 6 digits, zero-padded, from a cryptographically secure generator
    private String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
