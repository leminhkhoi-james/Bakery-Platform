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
InternalSubscriptionController is the sole owner of the entitlement URI. It reads
the approved period's feature snapshot, so plan edits/archival do not change
existing subscriptions. The service keeps its own SecurityConfig/JwtDecoderConfig
instead of importing the shared PlatformConfiguration security beans.

## Boundary

Outbound Bakery validation acquires scoped five-minute service JWTs from Identity
using SUBSCRIPTION_CLIENT_SECRET, with caching/refresh before expiry through the
shared technical client. Only this HTTP client and its properties are imported;
the shared security configuration is not imported.

This feature may persist only data owned by Subscription Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

