# Category feature

## Responsibility

Bakery-owned product categories.

## Current state

ProductCategory has list/create/patch/delete endpoints under a bakery. Deleting
a category clears the category reference on its products. Responses use the
shared API envelope. Public product catalog can filter by category. JWT
membership checks protect management routes in every profile.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

