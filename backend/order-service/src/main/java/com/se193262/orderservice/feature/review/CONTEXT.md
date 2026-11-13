# Review feature

## Responsibility

Order-backed customer reviews and moderation.

## Current state

Customers can create, update and soft-delete reviews for completed orders. New
or edited reviews are `PENDING`; only the author and an admin can view them
until an admin publishes them. Admins can publish or hide a review, while a
deleted review cannot be restored.

## Boundary

This feature may persist only data owned by Order Service. References to other
services remain plain UUID values and must be validated through internal REST
contracts.

