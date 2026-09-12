package com.aerodynamic.aerodynamic.pricing_engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// required when a user logs into the system
public class LoginRequest {
    // Ensures that the email is not empty or blank
    @NotBlank(message = "Email is required")

    // Ensures that the email has a valid email format
    @Email(message = "Email must be a valid address")
    private String email;

    // Ensures that the password is not empty or blank
    @NotBlank(message = "Password is required")

    private String password;
    // Empty constructor used to create a LoginRequest object
    public LoginRequest() {
    }

    // Returns the user's email
    public String getEmail() {
        return email;
    }

    // Sets the user's email
    public void setEmail(String email) {
        this.email = email;
    }

    // Sets the user's password
    public String getPassword() {
        return password;
    }
    
    // Sets the user's password
    public void setPassword(String password) {
        this.password = password;
    }
}
