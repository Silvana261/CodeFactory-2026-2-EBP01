package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.aerodynamic.aerodynamic.pricing_engine.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    // DEVELOPMENT ONLY: prints the code in the console. Keep false in any shared environment.
    @Value("${app.recovery.log-code:false}")
    private boolean logCode;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendRecoveryCode(String to, String name, String code) {
        if (logCode) {
            log.warn("[DEV ONLY] Recovery code for {}: {}", to, code);
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (from != null && !from.isBlank()) {
                message.setFrom(from);
            }
            message.setTo(to);
            message.setSubject("AeroDynamic - Código de recuperación de contraseña");
            message.setText("Hola " + name + ",\n\n"
                    + "Tu código de verificación es: " + code + "\n\n"
                    + "Vence en 10 minutos y solo puede usarse una vez. "
                    + "Si no solicitaste este cambio, ignora este mensaje.");
            mailSender.send(message);
        } catch (MailException e) {
            // Do not propagate: the API answers the same way whether the email was sent or not
            log.error("Could not send the recovery email", e);
        }
    }
}
