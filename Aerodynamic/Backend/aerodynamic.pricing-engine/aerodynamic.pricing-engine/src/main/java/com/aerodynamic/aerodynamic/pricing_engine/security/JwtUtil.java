package com.aerodynamic.aerodynamic.pricing_engine.security;

import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// Marks this class as a Spring-managed component (a Bean)
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    // Constructor that automatically injects values from application.properties
    public JwtUtil(@Value("${jwt.secret}") String secret,
                    @Value("${jwt.expiration-ms}") long expirationMs) {
        // Converts the secret text into a secure cryptographic key for HMAC-SHA algorithms
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // Method to GENERATE a JWT token when the user logs in successfully
    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getEmail()) // Sets the main identifier of the token (user's email)
                .claim("role", user.getRole().name()) // Adds extra information (such as the user's role)
                .issuedAt(now) // Timestamp when the token was created
                .expiration(new Date(now.getTime() + expirationMs)) // Timestamp when the token will expire
                .signWith(key) // Digitally signs the token using the secret key to prevent tampering
                .compact(); // Builds and returns the final token as a text string (String)
    }

    // Method to PARSE and VALIDATE a JWT token when the client makes a protected request
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key) // Sets the secret key to verify that the token is legitimate
                .build()
                .parseSignedClaims(token) // Analyzes the token and validates that it hasn't expired or been altered
                .getPayload(); // Extracts and returns the internal data stored inside the token (Claims)
    }
}