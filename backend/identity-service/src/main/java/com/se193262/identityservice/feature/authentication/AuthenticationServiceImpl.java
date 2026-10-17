package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.exception.AccountUnavailableException;
import com.se193262.identityservice.exception.AuthenticationFailedException;
import com.se193262.identityservice.exception.DuplicateEmailException;
import com.se193262.identityservice.exception.ResourceNotFoundException;
import com.se193262.identityservice.feature.authentication.dto.LoginRequest;
import com.se193262.identityservice.feature.authentication.dto.RegisterRequest;
import com.se193262.identityservice.feature.user.CustomerProfile;
import com.se193262.identityservice.feature.user.PlatformRole;
import com.se193262.identityservice.feature.user.Role;
import com.se193262.identityservice.feature.user.RoleRepository;
import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserRepository;
import com.se193262.identityservice.feature.user.UserStatus;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;
import com.se193262.identityservice.security.UserPrincipal;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenSessionService tokenSessionService;
    private final Clock clock;

    public AuthenticationServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            TokenSessionService tokenSessionService,
            Clock clock
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenSessionService = tokenSessionService;
        this.clock = clock;
    }

    @Override
    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }
        Role customerRole = roleRepository.findByCode(PlatformRole.CUSTOMER.name())
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role has not been seeded"));
        Instant now = clock.instant();
        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                normalizeNullable(request.phoneNumber()),
                UserStatus.ACTIVE,
                now
        );
        user.addRole(customerRole);
        user.setCustomerProfile(new CustomerProfile(user, "vi", now));
        User savedUser = userRepository.save(user);
        return UserProfileResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public AuthenticationResult login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
        } catch (AccountStatusException exception) {
            throw new AccountUnavailableException();
        } catch (AuthenticationException exception) {
            throw new AuthenticationFailedException();
        }
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.id())
                .orElseThrow(AuthenticationFailedException::new);
        return tokenSessionService.createSession(user);
    }

    @Override
    public AuthenticationResult refresh(String rawRefreshToken) {
        return tokenSessionService.refresh(rawRefreshToken);
    }

    @Override
    public void logout(String rawRefreshToken) {
        tokenSessionService.logout(rawRefreshToken);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User"));
        return UserProfileResponse.fromEntity(user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
