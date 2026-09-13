package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import com.aerodynamic.aerodynamic.pricing_engine.dto.RegisterUserRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.UserResponse;
import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;
import com.aerodynamic.aerodynamic.pricing_engine.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse registerUser(RegisterUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole());

        user = userRepository.save(user);

        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());

        return response;
    }
}
