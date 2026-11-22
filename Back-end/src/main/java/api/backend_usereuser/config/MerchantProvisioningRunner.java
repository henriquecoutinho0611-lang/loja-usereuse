package api.backend_usereuser.config;

import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class MerchantProvisioningRunner {
    @Bean
    ApplicationRunner provisionMerchant(UserRepository users, PasswordEncoder passwords,
            @Value("${app.merchant.name:}") String name,
            @Value("${app.merchant.email:}") String email,
            @Value("${app.merchant.cpf:}") String cpf,
            @Value("${app.merchant.password:}") String password,
            @Value("${app.merchant.reset-password:false}") boolean resetPassword) {
        return args -> {
            boolean configured = !name.isBlank() || !email.isBlank() || !cpf.isBlank() || !password.isBlank();
            if (!configured) return;
            if (name.isBlank() || email.isBlank() || cpf.isBlank())
                throw new IllegalStateException("Para provisionar o lojista, informe nome, e-mail e CPF.");
            String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
            String normalizedCpf = cpf.replaceAll("\\D", "");
            if (normalizedCpf.length() != 11) throw new IllegalStateException("O CPF do lojista precisa ter 11 números.");
            var existing = users.findByEmailIgnoreCase(normalizedEmail);
            if (existing.isPresent()) {
                if (existing.get().getRole() != Role.MERCHANT)
                    throw new IllegalStateException("O e-mail configurado para lojista pertence a outro tipo de conta.");
                if (resetPassword) {
                    validatePassword(password);
                    UserEntity merchant = existing.get();
                    merchant.setName(name.trim());
                    merchant.setCpf(normalizedCpf);
                    merchant.setPasswordHash(passwords.encode(password));
                    users.save(merchant);
                }
                return;
            }
            validatePassword(password);
            UserEntity merchant = new UserEntity();
            merchant.setName(name.trim()); merchant.setEmail(normalizedEmail); merchant.setCpf(normalizedCpf);
            merchant.setPasswordHash(passwords.encode(password)); merchant.setRole(Role.MERCHANT);
            users.save(merchant);
        };
    }

    private void validatePassword(String password) {
        if (password.length() < 12)
            throw new IllegalStateException("A senha do lojista precisa ter pelo menos 12 caracteres.");
    }
}
