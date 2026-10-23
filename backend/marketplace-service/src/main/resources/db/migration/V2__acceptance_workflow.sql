ALTER TABLE request_images ADD COLUMN size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0);
CREATE TABLE offer_acceptance_workflows (
 id UUID PRIMARY KEY,
 cake_request_id UUID NOT NULL REFERENCES cake_requests(id),
 offer_id UUID NOT NULL REFERENCES offers(id),
 customer_id UUID NOT NULL,
 idempotency_key VARCHAR(128) NOT NULL,
 payload_fingerprint VARCHAR(64) NOT NULL,
 delivery_address_id UUID NOT NULL,
 customer_note VARCHAR(2000),
 status VARCHAR(20) NOT NULL CHECK (status IN ('PREPARED','RETRYING','SUCCEEDED','FAILED')),
 attempt_count INTEGER NOT NULL DEFAULT 0,
 next_retry_at TIMESTAMPTZ NOT NULL,
 lease_until TIMESTAMPTZ,
 lease_owner UUID,
 order_id UUID,
 order_number VARCHAR(40),
 error_status INTEGER,
 created_at TIMESTAMPTZ NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL,
 version BIGINT NOT NULL DEFAULT 0,
 UNIQUE(customer_id,idempotency_key)
);
CREATE UNIQUE INDEX uq_acceptance_reserved_request ON offer_acceptance_workflows(cake_request_id)
 WHERE status IN ('PREPARED','RETRYING','SUCCEEDED');
CREATE INDEX idx_acceptance_due ON offer_acceptance_workflows(next_retry_at) WHERE status IN ('PREPARED','RETRYING');
