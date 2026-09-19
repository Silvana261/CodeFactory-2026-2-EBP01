package com.aerodynamic.aerodynamic.pricing_engine;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import com.aerodynamic.aerodynamic.pricing_engine.model.enums.Role;
import com.aerodynamic.aerodynamic.pricing_engine.repository.UserRepository;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> {
        if (!userRepository.existsByEmail("admin@aerodynamic.com")) {
            User admin = new User();
            admin.setName("María González");
            admin.setEmail("admin@aerodynamic.com");
            admin.setPassword(passwordEncoder.encode("Admin2024!"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }
    };
}

}
