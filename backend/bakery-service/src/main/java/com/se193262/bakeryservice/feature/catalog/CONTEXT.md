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
Internal profile and membership APIs are owned by InternalBakeryController.

Delivery matching accepts Vietnamese diacritics, case/spacing variations, city
prefixes and common Ho Chi Minh City aliases. Numbered urban districts accept
`5`, `Quan 5`, `Quận 5`, `Q.5`, `District 5` and `D5`. City and district must both
match; named administrative types are retained. Only active configured service
areas qualify. Original address strings and fees are unchanged. This is a
compatibility comparison, not an official location directory or code migration.
All quote routes return HTTP 422 with `data.errorCode=DELIVERY_AREA_NOT_SERVED`
and a specific Vietnamese message when the delivery area is unavailable.
Order must preserve/map this error separately to show it in checkout.
InternalCatalogController owns the direct-order `/catalog/quotes` contract.
CatalogController provides `/users/{userId}/bakery-memberships`,
`/catalog/customization-quotes` and `/catalog/add-on-quotes` for Marketplace.
The two quote request/response shapes have distinct URIs to avoid merge conflicts
and preserve the direct-order contract. All require scoped service credentials.
All three quote routes require a current active Subscription entitlement; remote
validation failures return 503 instead of allowing an unchecked quote. Null list
elements in option/add-on selections are rejected by request validation.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
only the owner can manage the bakery. See ADR-004.
