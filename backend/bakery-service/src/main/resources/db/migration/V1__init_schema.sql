CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE bakeries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(180) NOT NULL,
    description TEXT,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(320),
    logo_object_key VARCHAR(512),
    cover_object_key VARCHAR(512),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_bakeries_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'CLOSED'))
);

CREATE TABLE bakery_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    user_id UUID NOT NULL,
    member_role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bakery_members_bakery_user UNIQUE (bakery_id, user_id),
    CONSTRAINT fk_bakery_members_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT ck_bakery_members_role CHECK (member_role IN ('OWNER', 'MANAGER', 'STAFF')),
    CONSTRAINT ck_bakery_members_status CHECK (status IN ('INVITED', 'ACTIVE', 'INACTIVE'))
);

CREATE TABLE bakery_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    ward VARCHAR(120),
    district VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(10,6),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bakery_addresses_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT ck_bakery_addresses_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_bakery_addresses_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    city VARCHAR(120) NOT NULL,
    district VARCHAR(120) NOT NULL,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    minimum_order NUMERIC(12,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_service_areas_bakery_location UNIQUE (bakery_id, city, district),
    CONSTRAINT fk_service_areas_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT ck_service_areas_delivery_fee CHECK (delivery_fee >= 0),
    CONSTRAINT ck_service_areas_minimum_order CHECK (minimum_order >= 0)
);

CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL,
    opens_at TIME,
    closes_at TIME,
    closed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_business_hours_bakery_day UNIQUE (bakery_id, day_of_week),
    CONSTRAINT fk_business_hours_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT ck_business_hours_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT ck_business_hours_time CHECK (closed = TRUE OR (opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at))
);

CREATE TABLE add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    category VARCHAR(80) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    image_object_key VARCHAR(512),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_add_ons_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT ck_add_ons_price CHECK (price >= 0)
);

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_categories_bakery_slug UNIQUE (bakery_id, slug),
    CONSTRAINT fk_product_categories_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bakery_id UUID NOT NULL,
    category_id UUID,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    customizable BOOLEAN NOT NULL DEFAULT FALSE,
    default_serving_size INTEGER,
    minimum_notice_hours INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_products_bakery_slug UNIQUE (bakery_id, slug),
    CONSTRAINT fk_products_bakery
        FOREIGN KEY (bakery_id) REFERENCES bakeries(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    CONSTRAINT ck_products_base_price CHECK (base_price >= 0),
    CONSTRAINT ck_products_serving_size CHECK (default_serving_size IS NULL OR default_serving_size > 0),
    CONSTRAINT ck_products_notice CHECK (minimum_notice_hours >= 0),
    CONSTRAINT ck_products_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'))
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_option_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    selection_type VARCHAR(30) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    minimum_selections INTEGER NOT NULL DEFAULT 0,
    maximum_selections INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_option_groups_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT ck_product_option_groups_type CHECK (selection_type IN ('SINGLE', 'MULTIPLE')),
    CONSTRAINT ck_product_option_groups_range CHECK (minimum_selections >= 0 AND maximum_selections >= minimum_selections)
);

CREATE TABLE product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_group_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_option_values_group
        FOREIGN KEY (option_group_id) REFERENCES product_option_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_bakery_members_user_id ON bakery_members(user_id);
CREATE INDEX idx_bakery_addresses_bakery_id ON bakery_addresses(bakery_id);
CREATE UNIQUE INDEX uq_bakery_addresses_one_primary
    ON bakery_addresses(bakery_id) WHERE is_primary = TRUE;
CREATE INDEX idx_service_areas_location ON service_areas(city, district) WHERE active = TRUE;
CREATE INDEX idx_add_ons_bakery_id ON add_ons(bakery_id);
CREATE INDEX idx_products_bakery_status ON products(bakery_id, status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE UNIQUE INDEX uq_product_images_one_primary
    ON product_images(product_id) WHERE is_primary = TRUE;
CREATE INDEX idx_product_option_groups_product_id ON product_option_groups(product_id);
CREATE INDEX idx_product_option_values_group_id ON product_option_values(option_group_id);
