package com.aerodynamic.aerodynamic.pricing_engine.service;

import java.util.List;

import com.aerodynamic.aerodynamic.pricing_engine.dto.RegisterUserRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;

/**
 * Service interface responsible for user operations.
 * Defines the contract for user registration.
 */
public interface UserService {

    /**
     * Registers a new user using the provided information.
     *
     * @param request object containing the user's registration information
     * @return a UserResponse containing the registered user's information
     */
    UserResponse registerUser(RegisterUserRequest request);
    List<UserResponse> getAllUsers();
}
