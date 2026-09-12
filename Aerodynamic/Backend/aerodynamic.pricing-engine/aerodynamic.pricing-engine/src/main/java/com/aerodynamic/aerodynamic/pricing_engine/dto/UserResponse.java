package com.aerodynamic.aerodynamic.pricing_engine.dto;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.Role;

public class UserResponse {

    // User's unique identifier
    private Long id;

    // User's name
    private String name;

    // User's email
    private String email;

    // User's role in the system
    private Role role;

    // Empty constructor
    public UserResponse() {
    }

    // Creates a response with the user's information
    public UserResponse(Long id, String name, String email, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    // Gets the user's ID
    public Long getId() {
        return id;
    }

    // Sets the user's ID
    public void setId(Long id) {
        this.id = id;
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

    // Gets the user's role
    public Role getRole() {
        return role;
    }

    // Sets the user's role
    public void setRole(Role role) {
        this.role = role;
    }
}
