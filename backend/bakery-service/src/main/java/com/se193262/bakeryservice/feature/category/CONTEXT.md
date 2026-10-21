# Category feature

## Responsibility

Bakery-owned product categories.

## Current state

ProductCategory has list/create/patch/delete endpoints under a bakery. Deleting
a category clears the category reference on its products. Responses use the
shared API envelope; the controller is available outside the `prod` profile
while public catalog filtering is pending. JWT membership checks are enforced.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

