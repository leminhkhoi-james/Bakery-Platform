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

Inventory: stockQuantity is available-to-sell, NULL means not initialized, zero
means sold out. Owner stock edits require the current entity version. Bakery V4
persists per-order allocations and release tombstones. Internal writes require
the order-service subject as well as the catalog quote scope. Quote never deducts.
See ADR-008 for retries, cancellation and Order-owned recovery.

2026-11-13: Free cake accessories are stated separately in the customer UI:
plates/forks and straight or numeral candles; gift preference goes in the order
note. Only explicitly selected extras add price/allocate paid add-on stock.
Paid seed accessories are straight candle sets, party hats and plate/fork sets.
Old fixture card IDs remain disabled for historical references. Other seed reruns
keep edited prices/stock/active flags; only exact old fixture candle names are renamed.
