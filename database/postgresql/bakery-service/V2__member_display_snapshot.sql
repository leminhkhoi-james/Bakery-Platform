-- Existing memberships are enriched through Identity on a later authorized read.
ALTER TABLE bakery_members ADD COLUMN display_name_snapshot VARCHAR(120);
