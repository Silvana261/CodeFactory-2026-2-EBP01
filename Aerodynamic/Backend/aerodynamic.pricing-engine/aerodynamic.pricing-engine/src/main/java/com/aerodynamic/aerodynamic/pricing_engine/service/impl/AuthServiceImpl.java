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
/**
 * Implementation of the AuthService interface.
 * Handles user authentication and returns the authenticated user's information.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
        /**
     * Creates an instance of AuthServiceImpl with the required dependencies.
     *
     * @param userRepository repository used to find users by email
     * @param passwordEncoder used to verify the user's password
     */
    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
        /**
     * Authenticates a user using their email and password.
     *
     * @param request object containing the user's login credentials
     * @return a UserResponse containing the authenticated user's information
     * @throws ResponseStatusException if the email does not exist or the password is incorrect
     */
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
    /**
     * Converts a User entity into a UserResponse object.
     *
     * @param user user entity to be converted
     * @return UserResponse containing the user's id, name, email, and role
     */
    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        return response;
    }
}