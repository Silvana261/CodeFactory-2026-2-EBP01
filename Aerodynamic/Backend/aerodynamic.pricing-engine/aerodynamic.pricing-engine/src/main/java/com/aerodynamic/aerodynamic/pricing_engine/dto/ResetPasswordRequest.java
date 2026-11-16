package com.aerodynamic.aerodynamic.pricing_engine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Step 3: the user sets the new password using the verified code
public record ResetPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is not valid")
        String email,

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "\\d{6}", message = "Code must have 6 digits")
        String code,

        // ASSUMPTION: password policy = at least 8 characters, one lowercase, one uppercase and one digit.
        // Replace the regex with the SAME policy used when registering a user.
        @NotBlank(message = "New password is required")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
                message = "Password must have at least 8 characters, with uppercase, lowercase and a digit")
        String newPassword) {
}
