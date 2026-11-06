ALTER TABLE bakery_members
    ADD COLUMN owner_activation_pending BOOLEAN NOT NULL DEFAULT FALSE;

-- Reconcile applications created before the pending flag existed. Existing
-- platform owners are recognized by Identity and marked complete on first check.
UPDATE bakery_members
SET owner_activation_pending = TRUE
WHERE member_role = 'OWNER' AND status = 'ACTIVE';

CREATE INDEX idx_bakery_members_pending_owner_activation
    ON bakery_members (bakery_id)
    WHERE owner_activation_pending AND status = 'ACTIVE';
