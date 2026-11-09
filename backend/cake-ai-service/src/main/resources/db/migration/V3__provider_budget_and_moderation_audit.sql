-- Existing records retain unknown provenance; never relabel historical fallback images as Gemini.
ALTER TABLE generation_executions ADD COLUMN reserved_provider_calls INTEGER NOT NULL DEFAULT 0
    CHECK (reserved_provider_calls BETWEEN 0 AND 9);
CREATE INDEX idx_generation_executions_budget ON generation_executions(created_at);
ALTER TABLE generated_designs ALTER COLUMN moderation_reason TYPE TEXT;
CREATE INDEX idx_generated_designs_moderation_queue ON generated_designs(moderation_status,created_at DESC,id DESC);

CREATE TABLE generation_provider_calls (
    id UUID PRIMARY KEY,
    execution_id UUID NOT NULL REFERENCES generation_executions(id) ON DELETE CASCADE,
    kind VARCHAR(30) NOT NULL CHECK (kind IN ('INPUT_MODERATION','IMAGE','OUTPUT_MODERATION')),
    model_name VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('STARTED','RETURNED','FAILED','UNKNOWN')),
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_generation_provider_calls_budget ON generation_provider_calls(created_at);
CREATE INDEX idx_generation_provider_calls_execution ON generation_provider_calls(execution_id);

CREATE TABLE design_moderation_events (
    id UUID PRIMARY KEY,
    design_id UUID NOT NULL REFERENCES generated_designs(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    previous_status VARCHAR(30) NOT NULL,
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('APPROVED','REJECTED')),
    reason VARCHAR(1000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_design_moderation_events_design ON design_moderation_events(design_id,created_at);
