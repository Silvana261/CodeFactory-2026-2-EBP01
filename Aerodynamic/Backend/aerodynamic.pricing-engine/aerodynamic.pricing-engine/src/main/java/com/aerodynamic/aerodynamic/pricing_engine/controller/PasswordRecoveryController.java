package com.aerodynamic.aerodynamic.pricing_engine.controller;

import com.aerodynamic.aerodynamic.pricing_engine.dto.ForgotPasswordRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.MessageResponse;
import com.aerodynamic.aerodynamic.pricing_engine.dto.ResetPasswordRequest;
import com.aerodynamic.aerodynamic.pricing_engine.dto.VerifyResetCodeRequest;
import com.aerodynamic.aerodynamic.pricing_engine.service.PasswordRecoveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoints for password recovery (the user has no session yet).
 */
@RestController
@RequestMapping("/api/auth")
public class PasswordRecoveryController {

    // Same text whether the email exists or not (Scenario 5, RNF-04)
    private static final String REQUEST_MESSAGE =
            "Si el correo está registrado, recibirás un código de verificación.";
    private static final String INVALID_CODE_MESSAGE =
            "El código es inválido o ha vencido. Puedes solicitar uno nuevo.";

    private final PasswordRecoveryService recoveryService;

    public PasswordRecoveryController(PasswordRecoveryService recoveryService) {
        this.recoveryService = recoveryService;
    }

    /** POST /api/auth/forgot-password */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        recoveryService.requestRecovery(request.email());
        return ResponseEntity.ok(new MessageResponse(REQUEST_MESSAGE));
    }

    /** POST /api/auth/verify-reset-code */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<MessageResponse> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        if (!recoveryService.verifyCode(request.email(), request.code())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(INVALID_CODE_MESSAGE));
        }
        return ResponseEntity.ok(new MessageResponse("Código verificado correctamente."));
    }

    /** POST /api/auth/reset-password */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        if (!recoveryService.resetPassword(request.email(), request.code(), request.newPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(INVALID_CODE_MESSAGE));
        }
        return ResponseEntity.ok(new MessageResponse("Tu contraseña fue actualizada correctamente."));
    }
}
