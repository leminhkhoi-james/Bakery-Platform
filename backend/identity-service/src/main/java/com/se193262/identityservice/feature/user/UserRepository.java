package com.se193262.identityservice.feature.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = {"roles", "customerProfile"})
    Optional<User> findByEmail(String email);

    @Override
    @EntityGraph(attributePaths = {"roles", "customerProfile"})
    Optional<User> findById(UUID id);
}
