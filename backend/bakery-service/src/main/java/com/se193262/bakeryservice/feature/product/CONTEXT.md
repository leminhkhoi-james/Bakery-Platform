# Product feature

## Responsibility

Products, product images and customization options.

## Current state

Product management has paginated list, create and patch endpoints. A product
starts in DRAFT. The PUT options endpoint atomically replaces groups and values,
preserving IDs supplied for the same product and deleting omitted entries.
Category ownership and option selection rules are checked. A PostgreSQL
integration test covers catalog creation, queries and option replacement.

Image upload/delete, publish/hide/archive, public catalog filtering, subscription
checks and signed media URLs are implemented. Publish requires a primary image,
active bakery and active subscription. Public catalog also checks entitlement;
the Subscription internal endpoint and service token are still needed at runtime.
JWT membership checks protect management routes in every profile.
Public/management lists accept `name`, `basePrice`, `createdAt`, or `id` sorting
with `asc`/`desc`; unknown fields are rejected before running the query. UUID
tie-breaking keeps chunk scanning/pagination stable for equal sort values.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

