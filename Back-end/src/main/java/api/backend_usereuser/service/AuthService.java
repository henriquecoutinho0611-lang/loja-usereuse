package api.backend_usereuser.service;

import api.backend_usereuser.dto.AuthResponse;
import api.backend_usereuser.dto.CustomerRegisterRequest;
import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final long tokenTtlSeconds;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtEncoder jwtEncoder,
                       @Value("${app.jwt.ttl-seconds:3600}") long tokenTtlSeconds) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    @Transactional
    public UserSummary registerCustomer(CustomerRegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
        UserEntity user = new UserEntity();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone() == null ? "" : request.phone().trim());
        user.setRole(Role.CUSTOMER);
        return UserSummary.from(users.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse loginCustomer(String email, String password) {
        return authenticate(email, password, Role.CUSTOMER);
    }

    @Transactional(readOnly = true)
    public AuthResponse loginMerchant(String email, String password, String cpf) {
        return authenticate(email, password, Role.MERCHANT);
    }

    @Transactional(readOnly = true)
    public UserSummary currentUser(String email) {
        return users.findByEmailIgnoreCase(normalizeEmail(email))
                .map(UserSummary::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conta não encontrada."));
    }

    private AuthResponse authenticate(String email, String password, Role expectedRole) {
        String normalizedEmail = normalizeEmail(email);
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, password));
        UserEntity user = users.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas."));
        if (user.getRole() != expectedRole) throw new ApiException(HttpStatus.FORBIDDEN, "Acesso não autorizado para este perfil.");
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(tokenTtlSeconds);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("usereuser")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("roles", List.of("ROLE_" + user.getRole().name()))
                .build();
        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", expiresAt.getEpochSecond(), user.getRole().name().toLowerCase(Locale.ROOT), user.getName(), user.getEmail(), user.getPhone());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
