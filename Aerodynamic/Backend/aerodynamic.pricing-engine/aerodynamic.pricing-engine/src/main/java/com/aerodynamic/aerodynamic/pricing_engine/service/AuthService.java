package com.aerodynamic.aerodynamic.pricing_engine.service;

import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginResponse;

/**
 * Service interface handling authentication operations for the application.
 * 
 * <p>This service defines the contract for processing user login requests 
 * and generating the corresponding authentication responses.</p>
 */
public interface AuthService {

    /**
     * Authenticates a user based on their login credentials.
     *
     * @param request the login request DTO containing user credentials (e.g., email and password)
     * @return a {@link LoginResponse} DTO containing the authentication token and user details upon success
     */
    LoginResponse login(LoginRequest request);
}