package api.backend_usereuser.service;

import api.backend_usereuser.dto.AuthResponse;
import api.backend_usereuser.dto.CustomerRegisterRequest;
import api.backend_usereuser.dto.LoginRequest;
import api.backend_usereuser.dto.MerchantLoginRequest;
import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.mapper.UserMapper;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
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
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final long tokenTtlSeconds;

    public AuthService(UserRepository users, UserMapper userMapper, PasswordEncoder passwordEncoder,
             AuthenticationManager authenticationManager, JwtEncoder jwtEncoder,
            @Value("${app.jwt.ttl-seconds:3600}") long tokenTtlSeconds) {
        this.users = users; this.userMapper = userMapper; this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager; this.jwtEncoder = jwtEncoder;
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    @Transactional
    public UserSummary registerCustomer(CustomerRegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
        UserEntity user = new UserEntity();
        user.setName(request.name().trim()); user.setEmail(email); user.setPhone(request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password())); user.setRole(Role.CUSTOMER);
        return userMapper.toSummary(users.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse loginCustomer(LoginRequest request) {
        UserEntity user = authenticate(request.email(), request.password());
        if (user.getRole() != Role.CUSTOMER) throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        return issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse loginMerchant(MerchantLoginRequest request) {
        UserEntity user = authenticate(request.email(), request.password());
        String cpf = request.cpf().replaceAll("\\D", "");
        if (user.getRole() != Role.MERCHANT || user.getCpf() == null || !user.getCpf().equals(cpf))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Dados de acesso do lojista inválidos.");
        return issue(user);
    }

    private UserEntity authenticate(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, password));
        } catch (RuntimeException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }
        return users.findByEmailIgnoreCase(normalizedEmail).filter(UserEntity::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));
    }

    private AuthResponse issue(UserEntity user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("usereuser-store").issuedAt(now)
                .expiresAt(now.plusSeconds(tokenTtlSeconds)).subject(user.getEmail())
                .claim("email", user.getEmail()).claim("name", user.getName())
                .claim("roles", List.of(user.getRole().name())).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", tokenTtlSeconds,
                user.getRole().name().toLowerCase(Locale.ROOT), user.getName(), user.getEmail(), user.getPhone());
    }

    private String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
}
