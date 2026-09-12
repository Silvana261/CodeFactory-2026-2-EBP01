package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RegisterUserRequest {

    // User's name
    @NotBlank(message = "Name is required")
    private String name;

    // User's email
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    // User's password
    @NotBlank(message = "Password is required")
    private String password;

    // User's role
    @NotNull(message = "Role is required")
    private Role role;

    // Empty constructor
    public RegisterUserRequest() {
    }

    // Gets the user's name
    public String getName() {
        return name;
    }

    // Sets the user's name
    public void setName(String name) {
        this.name = name;
    }

    // Gets the user's email
    public String getEmail() {
        return email;
    }

    // Sets the user's email
    public void setEmail(String email) {
        this.email = email;
    }

    // Gets the user's password
    public String getPassword() {
        return password;
    }

    // Sets the user's password
    public void setPassword(String password) {
        this.password = password;
    }

    // Gets the user's role
    public Role getRole() {
        return role;
    }

    // Sets the user's role
    public void setRole(Role role) {
        this.role = role;
    }
}
