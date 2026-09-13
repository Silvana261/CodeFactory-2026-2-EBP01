package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.LoginRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password")); // CA03

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid email or password"); // CA03
        }

        return toResponse(user); // CA01, CA02
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        return response;
    }
}