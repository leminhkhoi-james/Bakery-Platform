# Bakery feature

## Responsibility

Bakery profiles, approval state and operating configuration.

## Current state

Bakery, BakeryAddress, ServiceArea and BusinessHour entities are mapped to the
Bakery database schema. Basic profile create/read/update and atomic operations
replacement are implemented with one DTO type per request/response shape and a
standard API response envelope. There is no bakery delete in the API contract.

This temporary controller is disabled in the `prod` profile. Creation takes the
owner ID from the JWT subject and requires platform BAKERY_OWNER. Management
routes require an ACTIVE member of the requested bakery with a matching member
role. The current read endpoint is management-only and still returns DRAFT
bakeries without subscription filtering or signed media URLs. Identity
validation, image upload, approval workflow and public listing are pending.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

