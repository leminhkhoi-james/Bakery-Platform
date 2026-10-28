-- Archive retired membership records before removing their authorization.
CREATE TABLE retired_bakery_members (
    id UUID PRIMARY KEY,
    bakery_id UUID NOT NULL,
    user_id UUID NOT NULL,
    member_role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    retired_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO retired_bakery_members (id, bakery_id, user_id, member_role, status, joined_at)
SELECT id, bakery_id, user_id, member_role, status, joined_at
FROM bakery_members WHERE member_role <> 'OWNER';
DELETE FROM bakery_members WHERE member_role <> 'OWNER';
ALTER TABLE bakery_members DROP CONSTRAINT ck_bakery_members_role;
ALTER TABLE bakery_members ADD CONSTRAINT ck_bakery_members_role CHECK (member_role = 'OWNER');
