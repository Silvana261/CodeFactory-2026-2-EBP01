package com.aerodynamic.aerodynamic.pricing_engine.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Verification code sent by email during password recovery.
 * The code itself is never stored: only its hash (RNF-02).
 */
@Entity
@Table(name = "password_reset_codes")
public class PasswordResetCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Expiration moment: 10 minutes after creation (RNF-01)
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    // True once the code was used, replaced by a newer one, expired or blocked (RF-06)
    @Column(nullable = false)
    private boolean consumed;

    public PasswordResetCode() {
    }

    public PasswordResetCode(User user, String codeHash, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.user = user;
        this.codeHash = codeHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getCodeHash() { return codeHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }
}
