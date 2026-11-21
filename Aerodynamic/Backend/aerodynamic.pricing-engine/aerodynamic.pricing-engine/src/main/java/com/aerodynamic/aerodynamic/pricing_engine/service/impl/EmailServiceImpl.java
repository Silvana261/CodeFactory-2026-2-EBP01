package com.aerodynamic.aerodynamic.pricing_engine.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.aerodynamic.aerodynamic.pricing_engine.service.EmailService;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends the recovery code through Brevo's HTTP API (HTTPS), because hosts such as
 * Render's free tier block outbound SMTP ports.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String from;

    // DEVELOPMENT ONLY: prints the code in the console. Keep false in any shared environment.
    @Value("${app.recovery.log-code:false}")
    private boolean logCode;

    public EmailServiceImpl(@Value("${brevo.api-key:}") String apiKey,
                            @Value("${app.mail.from:}") String from) {
        this.apiKey = apiKey;
        this.from = from;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public void sendRecoveryCode(String to, String name, String code) {
        if (logCode) {
            log.warn("[DEV ONLY] Recovery code for {}: {}", to, code);
        }
        if (apiKey == null || apiKey.isBlank() || from == null || from.isBlank()) {
            log.warn("BREVO_API_KEY or MAIL_FROM is not configured: recovery email not sent");
            return;
        }
        try {
            // Plain text (not HTML) so the user's name can never inject markup into the email
            String text = "Hola " + name + ",\n\n"
                    + "Tu código de verificación es: " + code + "\n\n"
                    + "Vence en 10 minutos y solo puede usarse una vez. "
                    + "Si no solicitaste este cambio, ignora este mensaje.";

            restClient.post()
                    .uri("/smtp/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "sender", Map.of("name", "AeroDynamic", "email", from),
                            "to", List.of(Map.of("email", to, "name", name)),
                            "subject", "AeroDynamic - Código de recuperación de contraseña",
                            "textContent", text))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            // Brevo answered with an error (401 bad key, 400 unverified sender...)
            log.error("Brevo rejected the recovery email: {} {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
        } catch (RestClientException e) {
            // Network problem or timeout. Do not propagate: the API answers the same either way
            log.error("Could not send the recovery email", e);
        }
    }
}