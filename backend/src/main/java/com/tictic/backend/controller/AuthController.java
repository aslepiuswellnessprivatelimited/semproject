package com.tictic.backend.controller;

import com.tictic.backend.model.User;
import com.tictic.backend.security.JwtService;
import com.tictic.backend.store.ArrayStore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final ArrayStore store; private final PasswordEncoder encoder; private final JwtService jwtService;
    public AuthController(ArrayStore store, PasswordEncoder encoder, JwtService jwtService) { this.store = store; this.encoder = encoder; this.jwtService = jwtService; }

    @PostMapping("/register")
    ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (store.getUsers().stream().anyMatch(user -> user.getEmail().equalsIgnoreCase(request.email()))) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "An account with that email already exists"));
        User user = new User(UUID.randomUUID().toString(), request.name(), request.email().toLowerCase(), request.phone(), encoder.encode(request.password()), "USER");
        store.getUsers().add(user); store.save();
        return ResponseEntity.ok(authResponse(user));
    }

    @PostMapping("/login")
    ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = store.getUsers().stream().filter(candidate -> candidate.getEmail().equalsIgnoreCase(request.email())).findFirst().orElse(null);
        if (user == null || !encoder.matches(request.password(), user.getPasswordHash())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Email or password is incorrect"));
        return ResponseEntity.ok(authResponse(user));
    }

    private Map<String, Object> authResponse(User user) { return Map.of("token", jwtService.createToken(user.getEmail(), user.getRole()), "user", Map.of("name", user.getName(), "email", user.getEmail(), "role", user.getRole())); }
    public record RegisterRequest(@NotBlank String name, @Email @NotBlank String email, @Pattern(regexp = "\\d{10}", message = "Phone must contain exactly 10 digits") String phone, @NotBlank String password) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
}
