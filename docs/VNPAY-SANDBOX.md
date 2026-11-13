# VNPay Sandbox — Subscription Service

Backend integration for bakery subscription purchases. Cake orders are outside
this flow. Manual evidence/admin approval remains supported.

## Configuration

Register a sandbox merchant at https://sandbox.vnpayment.vn/devreg/ and place
the supplied credentials in your untracked `.env` or secret manager:

```dotenv
SUBSCRIPTION_VNPAY_ENABLED=true
SUBSCRIPTION_VNPAY_TMN_CODE=<merchant TmnCode>
SUBSCRIPTION_VNPAY_HASH_SECRET=<merchant HashSecret>
SUBSCRIPTION_VNPAY_RETURN_URL=https://<frontend-host>/subscription-vnpay-return
```

Do not commit the actual secret. The example files intentionally leave it empty.
The gateway stays disabled unless enabled and fully configured. Payment URL is
the official sandbox endpoint. Rebuild/restart subscription-service after changes;
Flyway applies V5 automatically. Docker Compose forwards these four variables.

Register this **IPN URL** with VNPay:

```text
https://<public-gateway>/subscription/api/v1/payments/vnpay/ipn
```

VNPay must reach that URL from its servers; localhost alone cannot receive IPN.
A public HTTPS development tunnel can expose the API Gateway. Return URL can be
local for browser testing, but it cannot activate a subscription. API Gateway
strips `/subscription` when forwarding to Subscription Service. A reverse proxy
must preserve query parameters. Client IP uses the servlet's remote address;
configure trusted proxy handling at the deployment boundary if the actual client
IP is needed. Arbitrary forwarded headers are not accepted as payment IP input.

## API usage

1. Create an order using the existing authenticated purchase endpoint.
2. Call `POST /subscription/api/v1/subscription-orders/{orderId}/vnpay/checkout`
   with the owner's CUSTOMER/BAKERY_OWNER bearer token. No request body required.
   The server takes amount/currency from the saved order and checks membership.
3. Read `data.paymentUrl` and redirect the browser to VNPay. Response also has
   `attemptId`, `orderId`, `expiresAt`. Retry reuses an unexpired pending attempt.
4. Use the test card/account instructions on VNPay's official sandbox site.
5. VNPay sends IPN; successful verification records APPROVED payment, COMPLETED
   order and exactly one ACTIVE/SCHEDULED period in one database transaction.
6. Read the existing authenticated order endpoint to show authoritative status.
   Frontend `/subscription-vnpay-return` forwards the signed query to the public
   backend return-verification endpoint. It polls for up to roughly 30 seconds,
   then offers a manual recheck. Browser return never performs settlement.

The order detail shared by onboarding and subscription management now includes
the VNPay checkout button. Manual evidence is under an expandable section.
Session storage keeps only the original order/bakery IDs, never tokens or secrets,
to reopen the correct order after verified return. Without storage, users can
select their bakery from the subscription workspace. Frontend return is public
so expired sign-in does not hide verification; viewing order detail still requires
authentication and ownership. Local development uses
`http://localhost:5173/subscription-vnpay-return`; restart backend after changing
the return URL. Frontend host must serve the SPA on this route. IPN still targets
the backend public URL, not the frontend return page.

When exposing the Vite frontend with a tunnel, add its exact HTTPS origin to
`IDENTITY_CORS_ALLOWED_ORIGINS` in the untracked root `.env`, separated by a comma
from `http://localhost:5173`. Compose forwards this setting to Identity Service;
recreate only identity-service to apply it. A tunnel origin absent from that list
causes auth refresh/login to return CORS 403 before order detail loads. Cookies
belong to each hostname, so sign in again on the public hostname using the same
Bakery Platform account. Never use wildcard origins with credential cookies.

Only positive whole VND amounts are accepted. URL amount is the order amount
multiplied by 100. Checkout lasts up to 15 minutes and never beyond order expiry.
An active attempt blocks manual evidence to reduce competing payment flows.
Failed or expired attempts allow retries/manual fallback. The legacy
`sandboxEnabled=false` field refers to the removed local simulator, not VNPay.

## IPN and reconciliation

IPN returns HTTP 200 with VNPay's plain `RspCode`/`Message` object, not the normal
API envelope: 00 recorded, 02 already confirmed, 01 missing reference, 04 wrong
amount, 97 invalid checksum/merchant/duplicate parameters, 99 retryable failure.
Both `vnp_ResponseCode` and `vnp_TransactionStatus` must be 00 to activate.
HMAC-SHA512 uses sorted URL-encoded VNPay fields, excluding hash/hash-type.

Successful delayed IPNs can settle expired unpaid orders if signed pay time is
inside the original attempt window. Conflicting paid notifications (for example,
an order already in manual review) become REVIEW_REQUIRED and do not grant a
second period. ADMIN lists them with:

```text
GET /subscription/api/v1/admin/vnpay-attempts?status=REVIEW_REQUIRED&page=1&size=20
```

Resolve these against the merchant transaction report; automatic refunds and
VNPay query/refund APIs are outside this implementation. Other statuses can be
filtered too. Gateway approval sets verification_source=VNPAY and no admin ID;
manual reviewed payments retain verification_source=MANUAL and their admin ID.

## Validation

Automated tests cover signing vectors, tampering, merchant/amount mismatch,
failed/cancelled payments, browser return, late IPNs, retries, access rules,
duplicate parameters, PostgreSQL migration, concurrent IPNs, transaction reuse,
rollback and manual fallback. They use test-only credentials and do not contact
VNPay. A live sandbox checkout still requires merchant credentials and public IPN.

Frontend verification commands (from `frontend/`):

```sh
node --test tests/vnpay.test.js tests/vnpay-browser.test.js tests/subscription.test.js
node --test --test-name-pattern="Active VNPay" tests/subscription-ui.test.js
npm run build
```

The browser tests use Chrome headless and isolated API fixtures, including the
redirect destination. They never charge a card or contact the merchant gateway.
Checkout layout was visually checked at 1440, 1024, 820, 768 and 390 px.

Official contract: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html

## Runtime troubleshooting

After code changes, rebuild/recreate the running Subscription Service container.
A frontend reload alone cannot update backend security matchers. An old image
can reject the new checkout route with 403 even when the same owner can create
and read subscription orders. A quick anonymous GET to
`/api/v1/payments/vnpay/ipn` must return a VNPay protocol object (`97` for invalid
unsigned input with configuration, `99` while disabled), rather than a JWT 401.
Use the same check through the frontend `/api/v1` proxy to verify routing.
Disabled/missing merchant configuration yields checkout 503; it must not be
worked around by broadening ownership or anonymous checkout access.
