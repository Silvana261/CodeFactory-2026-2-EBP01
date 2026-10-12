package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller responsible for handling user authentication endpoints.
 * 
 * <p>Exposes public endpoints for logging into the application and obtaining 
 * the necessary security tokens.</p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Constructs the AuthController with the required authentication service.
     *
     * @param authService the authentication service business logic handler
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates a user based on the provided credentials.
     *
     * <p>Endpoint: {@code POST /api/auth/login}</p>
     *
     * @param request the validated login request payload containing credentials
     * @return a {@link ResponseEntity} containing the {@link LoginResponse} and an HTTP 200 (OK) status
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}