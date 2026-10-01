CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    cake_request_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    model_name VARCHAR(120) NOT NULL,
    generation_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_generation_jobs_status CHECK (status IN ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    CONSTRAINT ck_generation_jobs_times CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE source_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_job_id UUID NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_source_images_job
        FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE
);

CREATE TABLE prompt_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_job_id UUID NOT NULL,
    revision_number INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    negative_prompt TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prompt_revisions_job_revision UNIQUE (generation_job_id, revision_number),
    CONSTRAINT uq_prompt_revisions_id_job UNIQUE (id, generation_job_id),
    CONSTRAINT fk_prompt_revisions_job
        FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE,
    CONSTRAINT ck_prompt_revisions_number CHECK (revision_number > 0)
);

CREATE TABLE generated_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_job_id UUID NOT NULL,
    prompt_revision_id UUID NOT NULL,
    image_object_key VARCHAR(512) NOT NULL,
    thumbnail_object_key VARCHAR(512),
    random_seed BIGINT,
    model_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    moderation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_generated_designs_job
        FOREIGN KEY (generation_job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_generated_designs_prompt_job
        FOREIGN KEY (prompt_revision_id, generation_job_id)
        REFERENCES prompt_revisions(id, generation_job_id) ON DELETE CASCADE,
    CONSTRAINT ck_generated_designs_seed CHECK (random_seed IS NULL OR random_seed >= 0),
    CONSTRAINT ck_generated_designs_moderation CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_generation_jobs_customer_id ON generation_jobs(customer_id);
CREATE INDEX idx_generation_jobs_request_id ON generation_jobs(cake_request_id);
CREATE INDEX idx_generation_jobs_status_created ON generation_jobs(status, created_at);
CREATE INDEX idx_source_images_job_id ON source_images(generation_job_id);
CREATE INDEX idx_prompt_revisions_job_id ON prompt_revisions(generation_job_id);
CREATE INDEX idx_generated_designs_job_id ON generated_designs(generation_job_id);
CREATE INDEX idx_generated_designs_prompt_id ON generated_designs(prompt_revision_id);
