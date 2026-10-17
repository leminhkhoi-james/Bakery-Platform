package com.se193262.identityservice.feature.authentication;

import com.se193262.identityservice.config.AuthProperties;
import com.se193262.identityservice.exception.AccountUnavailableException;
import com.se193262.identityservice.exception.InvalidRefreshTokenException;
import com.se193262.identityservice.exception.ResourceNotFoundException;
import com.se193262.identityservice.feature.authentication.dto.TokenResponse;
import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserRepository;
import com.se193262.identityservice.feature.user.UserStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class TokenSessionService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;
    private final RefreshTokenGenerator refreshTokenGenerator;
    private final RefreshTokenHasher refreshTokenHasher;
    private final AuthProperties authProperties;
    private final Clock clock;

    public TokenSessionService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtTokenService jwtTokenService,
            RefreshTokenGenerator refreshTokenGenerator,
            RefreshTokenHasher refreshTokenHasher,
            AuthProperties authProperties,
            Clock clock
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
        this.refreshTokenGenerator = refreshTokenGenerator;
        this.refreshTokenHasher = refreshTokenHasher;
        this.authProperties = authProperties;
        this.clock = clock;
    }

    @Transactional
    public AuthenticationResult createSession(User user) {
        AccessToken accessToken = jwtTokenService.issueUserToken(user);
        String rawRefreshToken = refreshTokenGenerator.generate();
        Instant now = clock.instant();
        RefreshToken refreshToken = new RefreshToken(
                user,
                refreshTokenHasher.hash(rawRefreshToken),
                now.plus(authProperties.refreshTokenTtl()),
                now
        );
        refreshTokenRepository.save(refreshToken);
        TokenResponse response = new TokenResponse(accessToken.value(), "Bearer", accessToken.expiresInSeconds());
        return new AuthenticationResult(response, rawRefreshToken);
    }

    @Transactional(noRollbackFor = {InvalidRefreshTokenException.class, AccountUnavailableException.class})
    public AuthenticationResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        Instant now = clock.instant();
        RefreshToken storedToken = refreshTokenRepository
                .findByTokenHashForUpdate(refreshTokenHasher.hash(rawRefreshToken))
                .orElseThrow(InvalidRefreshTokenException::new);
        UUID userId = storedToken.getUser().getId();

        rejectRevokedOrExpired(storedToken, userId, now);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User"));
        if (user.getStatus() != UserStatus.ACTIVE) {
            refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            throw new AccountUnavailableException();
        }
        storedToken.revoke(now);
        return createSession(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHashForUpdate(refreshTokenHasher.hash(rawRefreshToken))
                .ifPresent(token -> token.revoke(clock.instant()));
    }

    private void rejectRevokedOrExpired(RefreshToken storedToken, UUID userId, Instant now) {
        if (storedToken.getRevokedAt() != null) {
            refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            throw new InvalidRefreshTokenException();
        }
        if (!storedToken.getExpiresAt().isAfter(now)) {
            storedToken.revoke(now);
            throw new InvalidRefreshTokenException();
        }
    }
}
