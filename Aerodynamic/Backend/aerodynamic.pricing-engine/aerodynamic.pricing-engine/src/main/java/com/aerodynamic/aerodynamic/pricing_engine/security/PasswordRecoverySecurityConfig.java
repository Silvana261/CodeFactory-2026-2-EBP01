package com.aerodynamic.aerodynamic.pricing_engine.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Makes the three password recovery endpoints public (the user has no session yet).
 *
 * It is a separate filter chain that only applies to these routes, with higher priority than the
 * main one, so the existing SecurityConfig does not need to be edited.
 * If SecurityConfig already permits "/api/auth/**", this class is redundant but harmless.
 */
@Configuration
public class PasswordRecoverySecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain passwordRecoveryFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher(
                        "/api/auth/forgot-password",
                        "/api/auth/verify-reset-code",
                        "/api/auth/reset-password")
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
