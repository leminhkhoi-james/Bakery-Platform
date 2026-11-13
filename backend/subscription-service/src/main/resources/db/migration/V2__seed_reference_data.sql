INSERT INTO subscription_plans (
    id, code, name, description, monthly_price, currency,
    billing_period_months, status
) VALUES
    ('00000000-0000-0000-0000-000000000101', 'BASIC', 'Cơ bản',
     'Gói dành cho tiệm mới tham gia nền tảng', 199000, 'VND', 1, 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000102', 'PRO', 'Chuyên nghiệp',
     'Gói dành cho tiệm có nhiều sản phẩm và offer', 499000, 'VND', 1, 'ACTIVE'),
    ('00000000-0000-0000-0000-000000000103', 'PREMIUM', 'Cao cấp',
     'Gói có ưu tiên hiển thị trên nền tảng', 999000, 'VND', 1, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    currency = EXCLUDED.currency,
    billing_period_months = EXCLUDED.billing_period_months,
    status = EXCLUDED.status;

INSERT INTO plan_features (plan_id, feature_code, feature_value) VALUES
    ('00000000-0000-0000-0000-000000000101', 'MAX_PRODUCTS', '20'),
    ('00000000-0000-0000-0000-000000000101', 'MAX_MONTHLY_OFFERS', '50'),
    ('00000000-0000-0000-0000-000000000101', 'FEATURED_LISTING', 'false'),
    ('00000000-0000-0000-0000-000000000102', 'MAX_PRODUCTS', '100'),
    ('00000000-0000-0000-0000-000000000102', 'MAX_MONTHLY_OFFERS', '300'),
    ('00000000-0000-0000-0000-000000000102', 'FEATURED_LISTING', 'false'),
    ('00000000-0000-0000-0000-000000000103', 'MAX_PRODUCTS', '-1'),
    ('00000000-0000-0000-0000-000000000103', 'MAX_MONTHLY_OFFERS', '-1'),
    ('00000000-0000-0000-0000-000000000103', 'FEATURED_LISTING', 'true')
ON CONFLICT (plan_id, feature_code) DO UPDATE SET
    feature_value = EXCLUDED.feature_value;
