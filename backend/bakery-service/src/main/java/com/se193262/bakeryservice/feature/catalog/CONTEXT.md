# Catalog feature

## Responsibility

Public catalog browsing and internal quote orchestration over Bakery-owned
products, options, add-ons and availability.

## Current state

Public product browsing and `POST /internal/v1/catalog/quotes` are implemented.
Catalog has no separate table or entity; it composes products, options, add-ons,
delivery areas and active subscription entitlement. The quote response matches
Order Service's snapshot contract and expires in five minutes. Subscription's
internal entitlement endpoint and service JWT issuance are required for runtime
calls. Quote IDs are generated per request; there is no server-side quote store.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

