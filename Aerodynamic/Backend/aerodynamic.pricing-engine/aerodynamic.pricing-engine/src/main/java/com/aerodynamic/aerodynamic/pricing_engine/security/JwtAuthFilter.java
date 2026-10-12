package com.aerodynamic.aerodynamic.pricing_engine.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Marks this class as a Spring-managed component that filters HTTP requests once per request
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    // Constructor injection for the JWT utility helper
    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        // Read the "Authorization" header from the incoming HTTP request
        String header = request.getHeader("Authorization");

        // Check if the header exists and starts with the standard "Bearer " prefix
        if (header != null && header.startsWith("Bearer ")) {
            try {
                // Extract the token (removing "Bearer ") and parse/validate it
                Claims claims = jwtUtil.parse(header.substring(7));
                
                // Create an authentication token for Spring Security using the user's email and role
                var authentication = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role", String.class))));
                
                // Set the authenticated user into the Spring Security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException e) {
                // Invalid or expired token: does not authenticate, letting Spring return a 401 Unauthorized status
            }
        }
        // Continue with the standard filter chain execution
        chain.doFilter(request, response);
    }
}