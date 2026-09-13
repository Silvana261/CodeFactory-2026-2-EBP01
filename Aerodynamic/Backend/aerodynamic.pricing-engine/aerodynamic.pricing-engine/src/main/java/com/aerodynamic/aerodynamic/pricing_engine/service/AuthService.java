package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;

/**
 * Service interface responsible for authentication operations.
 * Defines the contract for user login.
 */
public interface AuthService {

    /**
     * Authenticates a user using the provided login credentials.
     *
     * @param request object containing the user's login information
     * @return a UserResponse containing the authenticated user's information
     */
    UserResponse login(LoginRequest request);
}