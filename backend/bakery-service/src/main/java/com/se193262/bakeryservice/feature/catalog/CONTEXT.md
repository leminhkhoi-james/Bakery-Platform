# Catalog feature

## Responsibility

Public catalog browsing and internal quote orchestration over Bakery-owned
products, options, add-ons and availability.

## Current state

Package skeleton only. The API contract includes public product browsing and
`POST /internal/v1/catalog/quotes` for Order Service. Catalog has no separate
table or entity; it composes data owned by the other Bakery features. Controllers,
services, DTOs and tests will be added when this feature is implemented.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

