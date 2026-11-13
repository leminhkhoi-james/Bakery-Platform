ALTER TABLE order_reviews
    ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE order_reviews
    DROP CONSTRAINT ck_order_reviews_status,
    ADD CONSTRAINT ck_order_reviews_status
        CHECK (status IN ('PENDING', 'PUBLISHED', 'HIDDEN', 'DELETED'));
