package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.RegisterUserRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;
import com.aerodynamic.aerodynamic.pricing_engine.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller responsible for handling user requests.
 * Provides endpoints for user registration and user retrieval.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    /**
     * Creates an instance of UserController with the required user service.
     *
     * @param userService service used to handle user operations
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registers a new user using the provided information.
     *
     * @param request object containing the user's registration information
     * @return a ResponseEntity containing the registered user's information
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(
            @Valid @RequestBody RegisterUserRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.registerUser(request));
    }

    /**
     * Retrieves all registered users.
     *
     * @return a ResponseEntity containing the list of registered users
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {

        return ResponseEntity.ok(userService.getAllUsers());
    }
}
