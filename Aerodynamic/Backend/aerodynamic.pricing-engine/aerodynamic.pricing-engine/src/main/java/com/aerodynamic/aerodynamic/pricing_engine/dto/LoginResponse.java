package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.Role;

/**
 * Data Transfer Object (DTO) representing the response returned to the client 
 * upon a successful user authentication (login).
 * 
 * <p>This record encapsulates the authentication token along with basic user details 
 * and their assigned system role.</p>
 *
 * @param token the JWT or authentication token issued for subsequent authorized requests
 * @param id the unique identifier of the user
 * @param name the full name of the user
 * @param email the email address associated with the user account
 * @param role the security role assigned to the user ( ADMIN, PRICING_ANALIST)
 */
public record LoginResponse(String token, Long id, String name, String email, Role role) {}