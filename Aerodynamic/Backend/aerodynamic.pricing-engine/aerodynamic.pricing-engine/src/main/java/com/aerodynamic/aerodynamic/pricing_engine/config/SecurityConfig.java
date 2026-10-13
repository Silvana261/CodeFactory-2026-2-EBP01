package com.aerodynamic.aerodynamic.pricing_engine.config;

import com.aerodynamic.aerodynamic.pricing_engine.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// Marks this class as a configuration class and enables Spring Security web security support
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Defines a PasswordEncoder bean using BCrypt hashing algorithm to securely encode and verify passwords
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Configures the main security filter chain that handles HTTP requests, rules, and filters
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtAuthFilter jwtAuthFilter,
                                                   CorsConfigurationSource corsSource) throws Exception {
        http
            // Disable CSRF since we are using stateless JWT authentication (no browser sessions)
            .csrf(csrf -> csrf.disable())
            // Configure CORS using the custom CorsConfigurationSource bean defined below
            .cors(cors -> cors.configurationSource(corsSource))
            // Make the session stateless (Spring Security will not create or store HTTP sessions)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Return an HTTP 401 Unauthorized status instead of redirecting to a login page when authentication fails
            .exceptionHandling(e -> e.authenticationEntryPoint(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            // Define rules for which endpoints are public and which require specific roles/authentication
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/pricing-rules/**").hasRole("PRICING_ANALYST")
                .requestMatchers("/api/flights/**").hasRole("PRICING_ANALYST")
                .anyRequest().authenticated())
            // Insert our custom JWT filter before the standard username/password authentication filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Defines CORS configuration rules, reading allowed origins dynamically from application properties
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins}") String[] allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins)); // Set allowed domains/frontends
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")); // Allowed HTTP methods
        configuration.setAllowedHeaders(List.of("*")); // Allow all request headers
        configuration.setAllowCredentials(true); // Allow cookies/credentials if needed

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply these CORS rules to all application paths
        return source;
    }
}