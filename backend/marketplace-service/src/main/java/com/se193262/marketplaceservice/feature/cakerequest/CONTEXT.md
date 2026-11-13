# Cake request feature

## Responsibility

Customer cake requests, preferences, reference images and selected designs.

## Current state

Request lifecycle, authorized pagination, JSONB preferences, option snapshots, Firebase image compensation, selected-design validation and the scoped internal chat-authorization contract are implemented. Chat authorization checks request ownership, request status and target/unexpired-pending/accepted bakery eligibility. All aggregate mutations touch the request optimistic version. Image uploads happen outside the metadata transaction.

Local runtime keeps Firebase disabled by default. The launcher's explicit
`--firebase-sandbox` option maps the existing root Firebase references and mounts
the existing credential read-only; it does not overwrite `.env` or generate keys.
Local automatic orphan cleanup is disabled so a shared sandbox bucket is not
reconciled against an unrelated local database. Production cleanup remains enabled
by default. Upload/delete contracts and compensation rules are unchanged.

## Boundary

Product customization reads Bakery's `/internal/v1/catalog/customization-quotes`;
add-on-only requests use `/internal/v1/catalog/add-on-quotes`. Direct-order quotes
keep their separate contract at `/internal/v1/catalog/quotes`.

This feature may persist only data owned by Marketplace Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.
