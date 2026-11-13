# Generated design feature

Owner/Admin metadata reads; other owners denied. `/storage/**` is retired with 404. Private GCS V4 URLs expire after 15 minutes and are issued only for APPROVED designs or ADMIN previews of PENDING designs. These URLs are bearer capabilities, not identity-bound links; do not log them. REJECTED media is never issued.

ADMIN discovery: GET `/api/v1/admin/generated-designs`, status PENDING (default), APPROVED, REJECTED or ALL, page >= 0, size 1..100. Response content/page/size/totalElements/totalPages.

PATCH existing moderation endpoint accepts APPROVED/REJECTED plus optional reason (1000 chars); only PENDING transitions succeed. Atomic update and append-only moderation event share a transaction; concurrent/repeated decisions conflict. DTO retains old fields and adds customer/RFQ IDs, providerMetadata, moderatedBy/At and moderationHistory.

Internal validation still requires service JWT audience cake-ai-service and cake-ai:design:validate scope. Selection remains the Marketplace owner's operation against the original RFQ.
