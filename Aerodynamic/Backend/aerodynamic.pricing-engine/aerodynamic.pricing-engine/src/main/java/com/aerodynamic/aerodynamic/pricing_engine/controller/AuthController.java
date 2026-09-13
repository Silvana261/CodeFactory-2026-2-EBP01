package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/**
 * REST controller responsible for handling authentication requests.
 * Provides endpoints for user login.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    /**
     * Creates an instance of AuthController with the required authentication service.
     *
     * @param authService service used to handle authentication logic
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    /**
     * Authenticates a user using the provided login credentials.
     *
     * @param request object containing the user's email and password
     * @return a ResponseEntity containing the authenticated user's information
     */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
