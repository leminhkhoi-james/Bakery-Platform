package com.se193262.identityservice.feature.user;

import com.se193262.identityservice.exception.ResourceNotFoundException;
import com.se193262.identityservice.feature.authentication.RefreshTokenRepository;
import com.se193262.identityservice.feature.user.dto.UpdateMyProfileRequest;
import com.se193262.identityservice.feature.user.dto.UserProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final Clock clock;

    public UserManagementService(UserRepository userRepository, RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository, Clock clock) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<UserProfileResponse> list(String email, UserStatus status, String role, int page, int size) {
        Specification<User> specification = Specification.unrestricted();
        if (StringUtils.hasText(email)) {
            String normalizedEmail = email.trim().toLowerCase();
            specification = specification.and((root, query, builder) ->
                    builder.like(builder.lower(root.get("email")), "%" + normalizedEmail + "%"));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("status"), status));
        }
        if (StringUtils.hasText(role)) {
            PlatformRole platformRole;
            try {
                platformRole = PlatformRole.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown platform role");
            }
            specification = specification.and((root, query, builder) -> {
                var roleJoin = root.join("roles");
                return builder.equal(roleJoin.get("code"), platformRole.name());
            });
        }
        return userRepository.findAll(specification,
                        PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(UserProfileResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse get(UUID userId) {
        return UserProfileResponse.fromEntity(findUser(userId));
    }

    @Transactional
    public UserProfileResponse updateMyProfile(UUID userId, UpdateMyProfileRequest request) {
        if (!request.hasChanges()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one profile field is required");
        }
        User user = findUser(userId);
        Instant now = clock.instant();
        user.updateProfile(normalize(request.displayName()), normalize(request.phoneNumber()), now);
        CustomerProfile profile = user.getCustomerProfile();
        if (profile != null && (request.dateOfBirth() != null || request.preferredLanguage() != null)) {
            profile.update(request.dateOfBirth(), normalize(request.preferredLanguage()), now);
        }
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse changeStatus(UUID userId, UUID actorId, UserStatus status) {
        rejectSelfOperation(userId, actorId);
        if (status == UserStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Administrators cannot set PENDING status");
        }
        User user = findUser(userId);
        if (user.getStatus() != status) {
            Instant now = clock.instant();
            user.changeStatus(status, now);
            if (status == UserStatus.BLOCKED || status == UserStatus.DELETED) {
                refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            }
        }
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse replaceRoles(UUID userId, UUID actorId, Set<String> requestedRoles) {
        rejectSelfOperation(userId, actorId);
        if (requestedRoles == null || requestedRoles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A user must have at least one role");
        }
        Set<Role> roles = new LinkedHashSet<>();
        for (String code : requestedRoles) {
            String normalized = code == null ? "" : code.trim().toUpperCase();
            if (!PlatformRole.isSupported(normalized)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Unknown platform role: " + code);
            }
            roles.add(roleRepository.findByCode(normalized)
                    .orElseThrow(() -> new ResourceNotFoundException("Role")));
        }
        User user = findUser(userId);
        user.replaceRoles(roles, clock.instant());
        return UserProfileResponse.fromEntity(user);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User"));
    }

    private void rejectSelfOperation(UUID userId, UUID actorId) {
        if (userId.equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Administrators cannot modify their own status or roles");
        }
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
