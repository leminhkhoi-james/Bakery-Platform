# Cake request feature

## Responsibility

Customer cake requests, preferences, reference images and selected designs.

## Current state

Request lifecycle, authorized pagination, JSONB preferences, option snapshots, Firebase image compensation, selected-design validation and the scoped internal chat-authorization contract are implemented. Chat authorization checks request ownership, request status and target/unexpired-pending/accepted bakery eligibility. All aggregate mutations touch the request optimistic version. Image uploads happen outside the metadata transaction.

## Boundary

This feature may persist only data owned by Marketplace Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.
