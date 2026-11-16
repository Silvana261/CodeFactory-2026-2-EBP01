package com.aerodynamic.aerodynamic.pricing_engine.service;

public interface PasswordRecoveryService {

    /** Scenario 1 and 5: starts the recovery. Does nothing visible if the email is not registered. */
    void requestRecovery(String email);

    /** Scenario 2 and 4: true only if the code is correct, not expired, not used and not blocked. */
    boolean verifyCode(String email, String code);

    /** Scenario 3: validates the code again, changes the password and invalidates the code. */
    boolean resetPassword(String email, String code, String newPassword);
}
