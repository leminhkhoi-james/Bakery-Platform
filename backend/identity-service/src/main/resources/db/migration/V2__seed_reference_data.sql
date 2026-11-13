INSERT INTO roles (id, code, description) VALUES
    (1, 'CUSTOMER', 'Khách hàng đặt bánh'),
    (2, 'BAKERY_OWNER', 'Chủ tiệm bánh'),
    (4, 'ADMIN', 'Quản trị viên nền tảng')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    description = EXCLUDED.description;
