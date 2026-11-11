package com.se193262.cakeaiservice.feature.generation;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromptRevisionRepository extends JpaRepository<PromptRevision, UUID> { }
