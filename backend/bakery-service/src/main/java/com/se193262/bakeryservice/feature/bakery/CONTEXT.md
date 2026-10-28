# Bakery feature

## Responsibility

Bakery profiles, approval state and operating configuration.

## Current state

Bakery, BakeryAddress, ServiceArea and BusinessHour entities are mapped to the
Bakery database schema. Basic profile create/read/update and atomic operations
replacement are implemented with one DTO type per request/response shape and a
standard API response envelope. There is no bakery delete in the API contract.

Creation takes the owner ID from the JWT subject and requires platform
BAKERY_OWNER. Management routes require an ACTIVE member of the requested bakery
with a matching role. Public browsing filters ACTIVE bakeries through the
Subscription entitlement client and signs stored logo/cover URLs. Logo/cover
upload, owner submission, admin status transitions, admin list/detail and
internal profile/membership lookup are implemented. Productive use of public
listing and internal clients requires service JWT issuance and the Subscription
entitlement and Identity user lookup endpoints. Admin detail includes members
and the subscription entitlement summary when Subscription is available.
Public/admin lists accept allow-listed sorting with stable UUID tie-breaking.
Creation validates the owner through Identity and saves the owner's display-name
snapshot in the local membership. Aggregate ratings remain pending an Order API.

## Boundary

Outbound Identity and Subscription calls acquire scoped five-minute service JWTs
from Identity through the shared technical ServiceHttpClient and cache them with
expiry skew. BAKERY_CLIENT_SECRET must match Identity's BCrypt client hash;
the private signing key remains only in Identity. An explicit static bearer can
still override token acquisition for existing deployments.

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.


## Authorization update — 2026-10-28

Platform roles are ADMIN, CUSTOMER and BAKERY_OWNER. Bakery membership only
supports OWNER. Bakery access requires ownership of the requested bakery;
retired staff/manager roles cannot authorize access. See ADR-004.
