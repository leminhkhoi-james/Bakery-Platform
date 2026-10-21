# Plan feature

## Responsibility

Subscription plan catalog and administration.

## Current state

SubscriptionPlan and its features are persisted in Subscription DB. Public APIs
list/get ACTIVE plans. Admin APIs list/create/patch/archive plans and return the
standard API response envelope. Admin endpoints require an ADMIN user JWT but
remain available only outside the `prod` profile. Existing order price/name
snapshots are not changed by plan edits; entitlement feature snapshots still
need a schema decision before subscription activation is implemented.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

