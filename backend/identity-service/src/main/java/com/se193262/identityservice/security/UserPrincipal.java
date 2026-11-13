package com.se193262.identityservice.security;

import com.se193262.identityservice.feature.user.User;
import com.se193262.identityservice.feature.user.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public final class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String passwordHash;
    private final UserStatus status;
    private final List<GrantedAuthority> authorities;

    private UserPrincipal(
            UUID id,
            String email,
            String passwordHash,
            UserStatus status,
            List<GrantedAuthority> authorities
    ) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.status = status;
        this.authorities = authorities;
    }

    public static UserPrincipal from(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.getCode()))
                .toList();
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus(),
                authorities
        );
    }

    public UUID id() {
        return id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
