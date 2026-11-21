package com.aerodynamic.aerodynamic.pricing_engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Step 2: the user enters the code received by email
public record VerifyResetCodeRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is not valid")
        String email,

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "\\d{6}", message = "Code must have 6 digits")
        String code) {
}
