CREATE TABLE vnpay_attempts (
    id UUID PRIMARY KEY,
    subscription_order_id UUID NOT NULL REFERENCES subscription_orders(id) ON DELETE RESTRICT,
    submitted_by_user_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > created_at),
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'REVIEW_REQUIRED')),
    transaction_no VARCHAR(30) UNIQUE,
    response_code VARCHAR(2),
    transaction_status VARCHAR(2),
    paid_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_vnpay_attempts_order ON vnpay_attempts(subscription_order_id, created_at DESC);
CREATE INDEX idx_vnpay_attempts_review ON vnpay_attempts(status, created_at);

ALTER TABLE bakery_payments ADD COLUMN verification_source VARCHAR(20) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE bakery_payments ADD CONSTRAINT ck_bakery_payments_verification_source
    CHECK (verification_source IN ('MANUAL', 'VNPAY'));
ALTER TABLE bakery_payments DROP CONSTRAINT ck_bakery_payments_review;
ALTER TABLE bakery_payments ADD CONSTRAINT ck_bakery_payments_review CHECK (
    (status = 'SUBMITTED' AND reviewed_by_admin_id IS NULL AND reviewed_at IS NULL)
    OR (status IN ('APPROVED', 'REJECTED') AND reviewed_at IS NOT NULL AND (
        (verification_source = 'MANUAL' AND reviewed_by_admin_id IS NOT NULL)
        OR (verification_source = 'VNPAY' AND payment_method = 'VNPAY'
            AND status = 'APPROVED' AND reviewed_by_admin_id IS NULL)
    ))
);
