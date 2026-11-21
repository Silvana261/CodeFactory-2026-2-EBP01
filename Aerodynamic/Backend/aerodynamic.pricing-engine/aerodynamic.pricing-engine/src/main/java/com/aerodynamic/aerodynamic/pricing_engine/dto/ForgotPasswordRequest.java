package com.aerodynamic.aerodynamic.pricing_engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// Step 1: the user asks for a verification code
public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is not valid")
        String email) {
}
