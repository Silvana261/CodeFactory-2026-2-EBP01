package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.model.PasswordResetCode;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.repository.PasswordResetCodeRepository;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordRecoveryServiceImplTest {

    private static final String EMAIL = "ana@airpricing.com";

    @Mock private UserRepository userRepository;
    @Mock private PasswordResetCodeRepository codeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;

    @InjectMocks private PasswordRecoveryServiceImpl service;

    private User user() {
        User u = new User();
        u.setName("Ana");
        u.setEmail(EMAIL);
        u.setPassword("OLDHASH");
        return u;
    }

    private PasswordResetCode code(User u, LocalDateTime created, LocalDateTime expires) {
        return new PasswordResetCode(u, "HASH", created, expires);
    }

    @Test // Scenario 5 / RNF-04
    void unknownEmailSendsNothing() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        service.requestRecovery(EMAIL);

        verify(emailService, never()).sendRecoveryCode(any(), any(), any());
        verify(codeRepository, never()).save(any());
    }

    @Test // Scenario 1, RNF-01, RNF-02
    void knownEmailStoresHashedCodeAndSendsEmail() {
        User u = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserOrderByCreatedAtDesc(u)).thenReturn(Optional.empty());
        when(codeRepository.findByUserAndConsumedFalse(u)).thenReturn(List.of());
        when(passwordEncoder.encode(anyString())).thenReturn("HASH");

        service.requestRecovery(EMAIL);

        ArgumentCaptor<PasswordResetCode> captor = ArgumentCaptor.forClass(PasswordResetCode.class);
        verify(codeRepository).save(captor.capture());
        PasswordResetCode saved = captor.getValue();
        assertEquals("HASH", saved.getCodeHash());
        assertEquals(10, Duration.between(saved.getCreatedAt(), saved.getExpiresAt()).toMinutes());
        verify(emailService).sendRecoveryCode(eq(EMAIL), eq("Ana"), matches("\\d{6}"));
    }

    @Test // resend cooldown
    void requestWithinCooldownDoesNotSendAnotherCode() {
        User u = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserOrderByCreatedAtDesc(u)).thenReturn(Optional.of(
                code(u, LocalDateTime.now().minusSeconds(10), LocalDateTime.now().plusMinutes(9))));

        service.requestRecovery(EMAIL);

        verify(emailService, never()).sendRecoveryCode(any(), any(), any());
    }

    @Test // Scenario 2
    void correctCodeIsAccepted() {
        User u = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(u)).thenReturn(Optional.of(
                code(u, LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusMinutes(9))));
        when(passwordEncoder.matches("123456", "HASH")).thenReturn(true);

        assertTrue(service.verifyCode(EMAIL, "123456"));
    }

    @Test // Scenario 4: expired
    void expiredCodeIsRejected() {
        User u = user();
        PasswordResetCode expired = code(u, LocalDateTime.now().minusMinutes(20), LocalDateTime.now().minusMinutes(10));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(u)).thenReturn(Optional.of(expired));

        assertFalse(service.verifyCode(EMAIL, "123456"));
        assertTrue(expired.isConsumed());
    }

    @Test // Scenario 4: wrong code, blocked after 5 attempts
    void wrongCodeCountsAttemptsAndBlocksAtTheLimit() {
        User u = user();
        PasswordResetCode stored = code(u, LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusMinutes(9));
        stored.setFailedAttempts(4);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(u)).thenReturn(Optional.of(stored));
        when(passwordEncoder.matches("000000", "HASH")).thenReturn(false);

        assertFalse(service.verifyCode(EMAIL, "000000"));
        assertEquals(5, stored.getFailedAttempts());
        assertTrue(stored.isConsumed());
    }

    @Test
    void unknownEmailCannotVerifyAnyCode() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertFalse(service.verifyCode(EMAIL, "123456"));
    }

    @Test // Scenario 3, RF-06, RNF-03
    void validCodeChangesPasswordAndConsumesCode() {
        User u = user();
        PasswordResetCode stored = code(u, LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusMinutes(9));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(u)).thenReturn(Optional.of(stored));
        when(passwordEncoder.matches("123456", "HASH")).thenReturn(true);
        when(passwordEncoder.encode("NewPass123")).thenReturn("NEWHASH");

        assertTrue(service.resetPassword(EMAIL, "123456", "NewPass123"));
        assertEquals("NEWHASH", u.getPassword());
        assertTrue(stored.isConsumed());
    }

    @Test
    void invalidCodeDoesNotChangePassword() {
        User u = user();
        PasswordResetCode stored = code(u, LocalDateTime.now().minusMinutes(1), LocalDateTime.now().plusMinutes(9));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(u));
        when(codeRepository.findFirstByUserAndConsumedFalseOrderByCreatedAtDesc(u)).thenReturn(Optional.of(stored));
        when(passwordEncoder.matches("000000", "HASH")).thenReturn(false);

        assertFalse(service.resetPassword(EMAIL, "000000", "NewPass123"));
        assertEquals("OLDHASH", u.getPassword());
    }
}
