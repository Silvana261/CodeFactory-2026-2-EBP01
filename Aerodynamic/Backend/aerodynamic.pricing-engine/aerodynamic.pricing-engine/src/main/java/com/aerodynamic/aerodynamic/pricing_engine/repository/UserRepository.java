package com.aerodynamic.aerodynamic.pricing_engine.repository;

import com.aerodynamic.aerodynamic.pricing_engine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    // HU registro (CA05): verificar si el correo ya existe
    boolean existsByEmail(String email);
    // HU login (CA01, CAO3): buscar el usuario para validar contraseña
}
