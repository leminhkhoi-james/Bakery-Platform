# Subscription feature

## Responsibility

Subscription periods and bakery entitlement.

## Current state

The bakery subscription read API returns the current ACTIVE period, the next
SCHEDULED period and active plan features when present. It returns null periods
when none exist. Payment approval, period creation/activation, expiry scheduler,
feature snapshots and the protected internal entitlement endpoint are pending.
The temporary read controller is disabled in `prod`. JWT authentication and
platform role checks are integrated; bakery membership validation is pending.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

