-- Preserve the former assignment for audit; never promote staff to bakery owner.
CREATE TABLE retired_platform_role_assignments (
    user_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    retired_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_code)
);
INSERT INTO retired_platform_role_assignments (user_id, role_code)
SELECT ur.user_id, r.code FROM user_roles ur JOIN roles r ON r.id = ur.role_id
WHERE r.code = 'BAKERY_STAFF';

-- Former staff can continue using customer features.
INSERT INTO user_roles (user_id, role_id)
SELECT retired.user_id, customer.id
FROM retired_platform_role_assignments retired CROSS JOIN roles customer
WHERE customer.code = 'CUSTOMER'
ON CONFLICT DO NOTHING;
DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE code = 'BAKERY_STAFF');
DELETE FROM roles WHERE code = 'BAKERY_STAFF';
ALTER TABLE roles ADD CONSTRAINT ck_roles_code
    CHECK (code IN ('ADMIN', 'CUSTOMER', 'BAKERY_OWNER'));
