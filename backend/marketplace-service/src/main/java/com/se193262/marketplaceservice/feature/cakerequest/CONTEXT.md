# Cake request feature

## Responsibility

Customer cake requests, preferences, reference images and selected designs.

## Current state

Request lifecycle, authorized pagination, JSONB preferences, option snapshots, Firebase image compensation, selected-design validation and the scoped internal chat-authorization contract are implemented. Chat authorization checks request ownership, request status and target/unexpired-pending/accepted bakery eligibility. All aggregate mutations touch the request optimistic version. Image uploads happen outside the metadata transaction.

## Boundary

Product customization reads Bakery's `/internal/v1/catalog/customization-quotes`;
add-on-only requests use `/internal/v1/catalog/add-on-quotes`. Direct-order quotes
keep their separate contract at `/internal/v1/catalog/quotes`.

This feature may persist only data owned by Marketplace Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
