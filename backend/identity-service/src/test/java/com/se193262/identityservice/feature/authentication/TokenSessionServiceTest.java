package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.config.AuthProperties;
import com.se193262.identityservice.exception.InvalidRefreshTokenException;
import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserRepository;
import com.se193262.identityservice.feature.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenSessionServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-13T00:00:00Z");

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtTokenService jwtTokenService;
    @Mock
    private RefreshTokenGenerator refreshTokenGenerator;
    @Mock
    private RefreshTokenHasher refreshTokenHasher;

    private TokenSessionService tokenSessionService;

    @BeforeEach
    void setUp() {
        AuthProperties properties = new AuthProperties(
                Duration.ofDays(7), "refresh_token", "/api/v1/auth", true, "Lax", 12);
        tokenSessionService = new TokenSessionService(
                refreshTokenRepository,
                userRepository,
                jwtTokenService,
                refreshTokenGenerator,
                refreshTokenHasher,
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    @DisplayName("Tạo session chỉ lưu hash của refresh token")
    void createSession_validUser_persistsOnlyHash() {
        User user = org.mockito.Mockito.mock(User.class);
        when(jwtTokenService.issueUserToken(user)).thenReturn(new AccessToken("access", 900));
        when(refreshTokenGenerator.generate()).thenReturn("raw-refresh");
        when(refreshTokenHasher.hash("raw-refresh")).thenReturn("hashed-refresh");

        AuthenticationResult result = tokenSessionService.createSession(user);

        assertEquals("raw-refresh", result.refreshToken());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Phát hiện reuse token đã revoke và revoke mọi session còn lại")
    void refresh_revokedToken_revokesAllActiveSessions() {
        UUID userId = UUID.randomUUID();
        User user = org.mockito.Mockito.mock(User.class);
        RefreshToken token = org.mockito.Mockito.mock(RefreshToken.class);
        when(refreshTokenHasher.hash("reused-token")).thenReturn("hash");
        when(refreshTokenRepository.findByTokenHashForUpdate("hash")).thenReturn(Optional.of(token));
        when(token.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(userId);
        when(token.getRevokedAt()).thenReturn(NOW.minusSeconds(1));

        assertThrows(InvalidRefreshTokenException.class,
                () -> tokenSessionService.refresh("reused-token"));

        verify(refreshTokenRepository).revokeAllActiveByUserId(userId, NOW);
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Refresh hợp lệ revoke token cũ và tạo session mới")
    void refresh_validToken_rotatesSession() {
        UUID userId = UUID.randomUUID();
        User user = org.mockito.Mockito.mock(User.class);
        RefreshToken token = org.mockito.Mockito.mock(RefreshToken.class);
        when(refreshTokenHasher.hash("old-token")).thenReturn("old-hash");
        when(refreshTokenRepository.findByTokenHashForUpdate("old-hash")).thenReturn(Optional.of(token));
        when(token.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(userId);
        when(token.getExpiresAt()).thenReturn(NOW.plusSeconds(60));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(user.getStatus()).thenReturn(UserStatus.ACTIVE);
        when(jwtTokenService.issueUserToken(user)).thenReturn(new AccessToken("access", 900));
        when(refreshTokenGenerator.generate()).thenReturn("new-token");
        when(refreshTokenHasher.hash("new-token")).thenReturn("new-hash");

        AuthenticationResult result = tokenSessionService.refresh("old-token");

        assertEquals("new-token", result.refreshToken());
        verify(token).revoke(NOW);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Refresh token bị thiếu luôn bị từ chối")
    void refresh_missingToken_throwsUnauthorized() {
        assertThrows(InvalidRefreshTokenException.class, () -> tokenSessionService.refresh(null));
        verify(refreshTokenRepository, never()).findByTokenHashForUpdate(any());
    }

    @Test
    @DisplayName("Refresh token hết hạn được revoke trước khi trả lỗi")
    void refresh_expiredToken_revokesAndThrowsUnauthorized() {
        User user = org.mockito.Mockito.mock(User.class);
        RefreshToken token = org.mockito.Mockito.mock(RefreshToken.class);
        when(refreshTokenHasher.hash("expired-token")).thenReturn("expired-hash");
        when(refreshTokenRepository.findByTokenHashForUpdate("expired-hash"))
                .thenReturn(Optional.of(token));
        when(token.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(UUID.randomUUID());
        when(token.getExpiresAt()).thenReturn(NOW.minusSeconds(1));

        assertThrows(InvalidRefreshTokenException.class,
                () -> tokenSessionService.refresh("expired-token"));

        verify(token).revoke(NOW);
    }
}
