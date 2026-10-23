# Subscription feature

## Responsibility

Subscription periods and bakery entitlement.

## Current state

The bakery read API returns current ACTIVE and next SCHEDULED periods with
snapshotted features. Admin approval creates an ACTIVE period or queues a renewal
after the current period. A scheduler activates due periods and expires ended
periods. The internal entitlement endpoint uses service JWT audience/scope and
returns inactive for bakeries without a current period. Public reads check Bakery
membership or ADMIN role, with bakery existence validated through Bakery Service.

## Boundary

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

