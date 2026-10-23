ALTER TABLE subscription_orders ADD COLUMN plan_code_snapshot VARCHAR(50);
ALTER TABLE subscription_orders ADD COLUMN features_snapshot JSONB;
UPDATE subscription_orders o SET plan_code_snapshot = p.code,
    features_snapshot = COALESCE((SELECT jsonb_object_agg(f.feature_code, f.feature_value)
        FROM plan_features f WHERE f.plan_id = o.plan_id), '{}'::jsonb)
FROM subscription_plans p WHERE p.id = o.plan_id;
ALTER TABLE subscription_orders ALTER COLUMN plan_code_snapshot SET NOT NULL;
ALTER TABLE subscription_orders ALTER COLUMN features_snapshot SET NOT NULL;

ALTER TABLE bakery_subscriptions ADD COLUMN features_snapshot JSONB;
UPDATE bakery_subscriptions s SET features_snapshot = o.features_snapshot
FROM subscription_orders o WHERE o.id = s.source_order_id;
ALTER TABLE bakery_subscriptions ALTER COLUMN features_snapshot SET NOT NULL;

ALTER TABLE bakery_payments ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE bakery_payments ADD COLUMN review_idempotency_key_hash VARCHAR(64);
CREATE UNIQUE INDEX uq_bakery_payments_review_key ON bakery_payments(review_idempotency_key_hash)
    WHERE review_idempotency_key_hash IS NOT NULL;
