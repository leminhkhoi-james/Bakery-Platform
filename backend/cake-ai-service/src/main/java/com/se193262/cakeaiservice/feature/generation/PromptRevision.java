package com.se193262.cakeaiservice.feature.generation;

import com.se193262.platform.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "prompt_revisions")
public class PromptRevision extends UuidEntity {
    @Column(name = "generation_job_id", nullable = false) private UUID generationJobId;
    @Column(name = "revision_number", nullable = false) private int revisionNumber;
    @Column(name = "prompt_text", nullable = false, columnDefinition = "text") private String promptText;
    @Column(name = "negative_prompt", columnDefinition = "text") private String negativePrompt;
    @Column(name = "created_by", nullable = false) private UUID createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    public PromptRevision() { }
    public String getPromptText() { return promptText; }

    public void setGenerationJobId(UUID value) { this.generationJobId = value; }
    public void setRevisionNumber(int value) { this.revisionNumber = value; }
    public void setPromptText(String value) { this.promptText = value; }
    public void setCreatedBy(UUID value) { this.createdBy = value; }
    public void setCreatedAt(Instant value) { this.createdAt = value; }
}
