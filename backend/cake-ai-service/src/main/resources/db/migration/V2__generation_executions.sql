ALTER TABLE source_images ADD COLUMN size_bytes BIGINT;
ALTER TABLE source_images ADD COLUMN moderation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (moderation_status IN ('PENDING','APPROVED','REJECTED'));
ALTER TABLE generated_designs ADD COLUMN media_type VARCHAR(100);
ALTER TABLE generated_designs ADD COLUMN size_bytes BIGINT;
ALTER TABLE generated_designs ADD COLUMN width INTEGER;
ALTER TABLE generated_designs ADD COLUMN height INTEGER;
ALTER TABLE generated_designs ADD COLUMN moderation_reason VARCHAR(80);
ALTER TABLE generated_designs ADD COLUMN moderated_by UUID;
ALTER TABLE generated_designs ADD COLUMN moderated_at TIMESTAMPTZ;

CREATE TABLE generation_executions (
    id UUID PRIMARY KEY,
    generation_job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    prompt_revision_id UUID NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    model_name VARCHAR(120) NOT NULL,
    generation_parameters JSONB NOT NULL,
    lease_until TIMESTAMPTZ,
    claim_token UUID,
    error_code VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    UNIQUE (id, generation_job_id, prompt_revision_id),
    FOREIGN KEY (prompt_revision_id, generation_job_id)
        REFERENCES prompt_revisions(id, generation_job_id) ON DELETE CASCADE,
    CHECK (status IN ('QUEUED','PROCESSING','SUCCEEDED','FAILED','CANCELLED'))
);
CREATE UNIQUE INDEX uq_generation_executions_active ON generation_executions(generation_job_id)
    WHERE status IN ('QUEUED','PROCESSING');
CREATE INDEX idx_generation_executions_queue ON generation_executions(status, created_at);
ALTER TABLE generated_designs ADD COLUMN execution_id UUID;
ALTER TABLE generated_designs ADD CONSTRAINT fk_generated_design_execution
    FOREIGN KEY (execution_id, generation_job_id, prompt_revision_id)
    REFERENCES generation_executions(id, generation_job_id, prompt_revision_id);

CREATE TABLE generation_idempotency (
    customer_id UUID NOT NULL,
    operation VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    generation_job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    response_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, operation, idempotency_key)
);
