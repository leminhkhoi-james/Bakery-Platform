# Plan feature

## Responsibility

Subscription plan catalog and administration.

## Current state

SubscriptionPlan and its features are persisted in Subscription DB. Public APIs
list/get ACTIVE plans. Admin APIs list/create/patch/archive plans and return the
standard API response envelope. Admin endpoints require an ADMIN user JWT in all
profiles. Orders snapshot plan name, code, price and features at creation; later
plan edits do not change existing order or activated period entitlement.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

