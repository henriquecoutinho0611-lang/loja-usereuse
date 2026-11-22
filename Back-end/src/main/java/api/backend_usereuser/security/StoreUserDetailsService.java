package api.backend_usereuser.security;

import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class StoreUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public StoreUserDetailsService(UserRepository users) { this.users = users; }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = users.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new UsernameNotFoundException("Conta não encontrada."));
        return User.withUsername(user.getEmail()).password(user.getPasswordHash())
                .roles(user.getRole().name()).disabled(!user.isActive()).build();
    }
}
