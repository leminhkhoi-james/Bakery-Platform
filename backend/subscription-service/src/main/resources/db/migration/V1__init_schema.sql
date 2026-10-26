CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    monthly_price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    billing_period_months INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_subscription_plans_price CHECK (monthly_price >= 0),
    CONSTRAINT ck_subscription_plans_period CHECK (billing_period_months > 0),
    CONSTRAINT ck_subscription_plans_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);

CREATE TABLE plan_features (
    plan_id UUID NOT NULL,
    feature_code VARCHAR(80) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    PRIMARY KEY (plan_id, feature_code),
    CONSTRAINT fk_plan_features_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

CREATE TABLE subscription_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(40) NOT NULL UNIQUE,
    bakery_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    requested_by_user_id UUID NOT NULL,
    plan_name_snapshot VARCHAR(120) NOT NULL,
    billing_period_months INTEGER NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_subscription_orders_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    CONSTRAINT ck_subscription_orders_period CHECK (billing_period_months > 0),
    CONSTRAINT ck_subscription_orders_amount CHECK (total_amount >= 0),
    CONSTRAINT ck_subscription_orders_expiry CHECK (expires_at > created_at),
    CONSTRAINT ck_subscription_orders_status CHECK (status IN ('PENDING_PAYMENT', 'PAYMENT_REVIEW', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'))
);

CREATE TABLE bakery_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_order_id UUID NOT NULL,
    submitted_by_user_id UUID NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(120) UNIQUE,
    proof_object_key VARCHAR(512),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    reviewed_by_admin_id UUID,
    review_note TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT fk_bakery_payments_order
        FOREIGN KEY (subscription_order_id) REFERENCES subscription_orders(id) ON DELETE CASCADE,
    CONSTRAINT ck_bakery_payments_evidence CHECK (payment_reference IS NOT NULL OR proof_object_key IS NOT NULL),
    CONSTRAINT ck_bakery_payments_amount CHECK (amount > 0),
    CONSTRAINT ck_bakery_payments_status CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_bakery_payments_review CHECK (
        (status = 'SUBMITTED' AND reviewed_by_admin_id IS NULL AND reviewed_at IS NULL)
        OR
        (status IN ('APPROVED', 'REJECTED') AND reviewed_by_admin_id IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

CREATE TABLE bakery_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    source_order_id UUID NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    activated_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_bakery_subscriptions_plan
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bakery_subscriptions_order
        FOREIGN KEY (source_order_id) REFERENCES subscription_orders(id) ON DELETE RESTRICT,
    CONSTRAINT ck_bakery_subscriptions_period CHECK (period_end > period_start),
    CONSTRAINT ck_bakery_subscriptions_status CHECK (status IN ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED'))
);

CREATE INDEX idx_subscription_orders_bakery_id ON subscription_orders(bakery_id);
CREATE INDEX idx_subscription_orders_plan_id ON subscription_orders(plan_id);
CREATE INDEX idx_subscription_orders_status ON subscription_orders(status);
CREATE INDEX idx_bakery_payments_order_id ON bakery_payments(subscription_order_id);
CREATE INDEX idx_bakery_payments_status ON bakery_payments(status);
CREATE INDEX idx_bakery_subscriptions_bakery_period ON bakery_subscriptions(bakery_id, period_start, period_end);
CREATE INDEX idx_bakery_subscriptions_plan_id ON bakery_subscriptions(plan_id);
CREATE UNIQUE INDEX uq_bakery_subscriptions_one_active
    ON bakery_subscriptions(bakery_id) WHERE status = 'ACTIVE';
