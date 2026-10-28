-- Keep participant IDs and message attribution; revoke participation without rewriting history.
UPDATE conversation_participants SET left_at = COALESCE(left_at, CURRENT_TIMESTAMP)
WHERE participant_type = 'BAKERY_STAFF';
ALTER TABLE conversation_participants ADD CONSTRAINT ck_active_participant_type
    CHECK (participant_type <> 'BAKERY_STAFF' OR left_at IS NOT NULL);
