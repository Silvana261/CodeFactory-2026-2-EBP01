package com.aerodynamic.aerodynamic.pricing_engine.model;

import java.time.LocalDateTime;

import com.aerodynamic.aerodynamic.pricing_engine.model.enums.Role;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.UserStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    // Unique identifier for the user
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User's name
    @Column(nullable = false)
    private String name;

    // User's unique email
    @Column(nullable = false, unique = true)
    private String email;

    // User's password
    @Column(nullable = false)
    private String password;

    // User's role in the system
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // User's status (active/inactive)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    // Date and time when the user was created
    @Column(nullable = false, updatable = false)
    private LocalDateTime created_at;

    // Empty constructor required by JPA
    public User() {
    }

    // Creates a user with the main user information
    public User(String name, String email, String password, Role role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Sets default values before the entity is first persisted
    @PrePersist
    protected void onCreate() {
        this.created_at = LocalDateTime.now();
        if (this.status == null) {
            this.status = UserStatus.ACTIVE;
        }
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

    // Gets the user's status
    public UserStatus getStatus() {
        return status;
    }

    // Sets the user's status
    public void setStatus(UserStatus status) {
        this.status = status;
    }

    // Gets the creation date
    public LocalDateTime getCreated_at() {
        return created_at;
    }
}