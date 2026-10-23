# Firebase Storage setup for Marketplace

Firebase is used only for binary image storage. Identity remains responsible for user JWTs;
PostgreSQL remains the source of truth for request metadata and access permissions.

## 1. Project and bucket

1. Open https://console.firebase.google.com/ and create a separate development project.
   Analytics is optional. Record the project ID.
2. Link Cloud Billing and select Blaze. Cloud Storage for Firebase requires this plan.
   Configure budget alerts; alerts do not automatically stop storage charges.
3. Open Storage, select Get started, choose the bucket location close to the backend,
   and create the bucket with restricted access.
4. Copy the exact bucket name, normally `<project-id>.firebasestorage.app` for a new bucket;
   old buckets can end with `.appspot.com`. Configuration must not include `gs://`.
5. In Storage > Rules publish:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Client SDK requests are denied. Backend Google Cloud Storage requests are authorized by IAM;
these Rules do not replace backend ownership checks. Signed URLs can be used by anyone who has
one until expiry, so do not log or persist them.

## 2. Backend service account

1. Open the same project in Google Cloud Console > IAM & Admin > Service Accounts.
2. Create `marketplace-storage-dev`.
3. On the bucket's Permissions page grant this account **Storage Object User**
   (`roles/storage.objectUser`) on that bucket. Do not make the bucket public.
4. For local development, open the service account > Keys > Add key > Create new key > JSON.
5. Store the downloaded key outside the repository, for example
   `C:/Users/lemin/.secrets/bakery-platform/marketplace-storage-dev.json`.
   Never commit it, put it under `src/main/resources`, or send it through chat.

The adapter constructs the GCS object client directly, so it does not need bucket-management
permissions merely to initialize. A local JSON private key signs V4 URLs locally. For a keyless
cloud deployment, attach a service account/workload identity and configure remote signing permissions
(`iam.serviceAccounts.signBlob`) on the signing account; bare end-user ADC is insufficient for signing.

## 3. Run outside Docker

Set these variables in the PowerShell session that launches Maven/Java, or in the IDE run configuration:

```powershell
$env:FIREBASE_PROJECT_ID = 'your-project-id'
$env:FIREBASE_STORAGE_BUCKET = 'your-project-id.firebasestorage.app'
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:/Users/lemin/.secrets/bakery-platform/marketplace-storage-dev.json'
```

Database, JWT and internal-service variables must also be configured. The storage adapter initializes
lazily: health and request creation do not require an immediate Firebase connection. An image operation
with invalid credentials/configuration returns 503.

## 4. Docker configuration

Copy the root `.env.example` to `.env` and set `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`
and `FIREBASE_CREDENTIALS_FILE`. Compose mounts the JSON read-only at `/run/secrets/firebase.json`;
`GOOGLE_APPLICATION_CREDENTIALS` inside the container points there, not to the Windows path.

## 5. Smoke test with your bucket

1. Login as CUSTOMER and POST a DRAFT request to Marketplace.
2. POST multipart `files` to `/api/v1/cake-requests/{id}/images` with the user bearer token.
   JPEG/PNG/WebP are accepted, up to 10 files per request and 10 MB each.
3. Verify the object appears under `marketplace/requests/{requestId}/` and metadata exists in
   `request_images`. The response includes `url`, `expiresAt`, MIME, byte size and display order.
4. Open the URL before expiry, then verify the same URL stops working after approximately 15 minutes.
5. DELETE the image while the request remains DRAFT; verify its metadata and object are removed.
6. Publish and confirm image mutation returns 409. An unrelated customer's access must return 403.

A normal browser `<img src>` can display the signed URL without Firebase JS SDK. If a future frontend
uses fetch/canvas to read the bytes, configure bucket CORS for that frontend origin separately.

## Official references

- [Admin Storage](https://firebase.google.com/docs/storage/admin/start)
- [Bucket and billing setup](https://firebase.google.com/docs/storage/web/start)
- [Admin credentials](https://firebase.google.com/docs/admin/setup)
- [V4 signed URLs](https://cloud.google.com/storage/docs/access-control/signing-urls-with-helpers)
- [Budget alerts](https://firebase.google.com/docs/projects/billing/budget-alerts)

Storage HTTP timeouts are configurable with `FIREBASE_CONNECT_TIMEOUT` (default 2s) and
`FIREBASE_READ_TIMEOUT` (default 30s). Internal REST clients have separate timeout configuration.
