# Add-on feature

## Responsibility

Bakery-owned product add-ons.

## Current state

AddOn has list/create/patch/delete endpoints under a bakery. Delete disables
the add-on (`active=false`) so existing references can remain intact. Image
upload uses MinIO/S3-compatible storage and returns a short-lived signed URL.
JWT membership checks protect management routes in every profile.

## Boundary

This feature may persist only data owned by Bakery Service. References to
other services remain plain UUID values and must be validated through internal
REST contracts.

