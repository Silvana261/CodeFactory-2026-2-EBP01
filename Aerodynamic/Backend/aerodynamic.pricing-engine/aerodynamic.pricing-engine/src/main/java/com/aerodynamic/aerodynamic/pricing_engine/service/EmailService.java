package com.aerodynamic.aerodynamic.pricing_engine.service;

public interface EmailService {

    /**
     * Sends the password recovery code to the given address.
     * Must never throw: a failure must not reveal whether the account exists (RNF-04).
     */
    void sendRecoveryCode(String to, String name, String code);
}
