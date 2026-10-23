# Subscription feature

## Responsibility

Subscription periods and bakery entitlement.

## Current state

Internal entitlement API reads the active subscription period and plan features. Public payment/subscription-management workflows remain pending.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

