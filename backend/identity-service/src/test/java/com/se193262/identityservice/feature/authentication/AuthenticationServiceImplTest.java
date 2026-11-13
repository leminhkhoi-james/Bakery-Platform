package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.exception.AccountUnavailableException;
import com.se193262.identityservice.exception.AuthenticationFailedException;
import com.se193262.identityservice.exception.DuplicateEmailException;
import com.se193262.identityservice.feature.authentication.dto.LoginRequest;
import com.se193262.identityservice.feature.authentication.dto.RegisterRequest;
import com.se193262.identityservice.feature.authentication.dto.TokenResponse;
import com.se193262.identityservice.feature.user.PlatformRole;
import com.se193262.identityservice.feature.user.Role;
import com.se193262.identityservice.feature.user.RoleRepository;
import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserRepository;
import com.se193262.identityservice.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private TokenSessionService tokenSessionService;

    private AuthenticationServiceImpl authenticationService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-10-13T00:00:00Z"), ZoneOffset.UTC);
        authenticationService = new AuthenticationServiceImpl(
                userRepository,
                roleRepository,
                passwordEncoder,
                authenticationManager,
                tokenSessionService,
                clock
        );
    }

    @Test
    @DisplayName("Đăng ký chuẩn hóa email, mã hóa mật khẩu và gán role CUSTOMER")
    void register_validRequest_createsActiveCustomer() {
        Role role = mock(Role.class);
        when(role.getCode()).thenReturn(PlatformRole.CUSTOMER.name());
        when(roleRepository.findByCode(PlatformRole.CUSTOMER.name())).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("StrongPass123!")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = authenticationService.register(new RegisterRequest(
                "  Customer@Example.com ", "StrongPass123!", "Customer", null));

        assertEquals("customer@example.com", response.email());
        assertEquals("ACTIVE", response.status());
        assertEquals(java.util.List.of("CUSTOMER"), response.roles());
        verify(passwordEncoder).encode("StrongPass123!");
    }

    @Test
    @DisplayName("Từ chối đăng ký khi email đã tồn tại")
    void register_existingEmail_throwsConflict() {
        when(userRepository.existsByEmail("customer@example.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authenticationService.register(
                new RegisterRequest("customer@example.com", "StrongPass123!", "Customer", null)));
    }

    @Test
    @DisplayName("Đăng nhập sai credential trả lỗi xác thực chung")
    void login_badCredentials_throwsUnauthorized() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));

        assertThrows(AuthenticationFailedException.class, () -> authenticationService.login(
                new LoginRequest("customer@example.com", "wrong-password")));
    }

    @Test
    @DisplayName("Từ chối đăng nhập tài khoản không hoạt động")
    void login_disabledAccount_throwsForbidden() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new DisabledException("disabled"));

        assertThrows(AccountUnavailableException.class, () -> authenticationService.login(
                new LoginRequest("customer@example.com", "StrongPass123!")));
    }

    @Test
    @DisplayName("Đăng nhập hợp lệ tạo access và refresh session")
    void login_validCredentials_createsSession() {
        UUID userId = UUID.randomUUID();
        UserPrincipal principal = mock(UserPrincipal.class);
        Authentication authentication = mock(Authentication.class);
        User user = mock(User.class);
        AuthenticationResult expected = new AuthenticationResult(
                new TokenResponse("access", "Bearer", 900), "refresh");
        when(authentication.getPrincipal()).thenReturn(principal);
        when(principal.id()).thenReturn(userId);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tokenSessionService.createSession(user)).thenReturn(expected);

        AuthenticationResult actual = authenticationService.login(
                new LoginRequest("CUSTOMER@example.com", "StrongPass123!"));

        assertEquals(expected, actual);
    }
}
