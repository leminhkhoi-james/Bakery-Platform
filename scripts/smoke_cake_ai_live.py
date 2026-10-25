"""Opt-in live smoke test. Requires running Identity/Marketplace/Cake AI and real credentials.

Creates labeled test users/requests and one paid generation; never prints tokens or signed URLs.
"""

import argparse
import datetime
import hashlib
import json
from pathlib import Path
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

CHECKS = []


def api(base, method, path, token=None, body=None, content_type=None, headers=None):
    request_headers = dict(headers or {})
    if token:
        request_headers["Authorization"] = "Bearer " + token
    if body is not None and not isinstance(body, bytes):
        body = json.dumps(body).encode()
        content_type = "application/json"
    if content_type:
        request_headers["Content-Type"] = content_type
    request = urllib.request.Request(base + path, data=body, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
            return response.status, json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        # HTTP failures are asserted by callers; do not expose raw auth/provider responses.
        return error.code, None


def multipart(metadata=None, image=None, image_part="sourceImages"):
    boundary = "cake-ai-smoke-" + uuid.uuid4().hex
    chunks = []
    if metadata is not None:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n'
                       'Content-Type: application/json\r\n\r\n').encode() + json.dumps(metadata).encode() + b"\r\n")
    if image:
        chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{image_part}"; filename="reference.jpg"\r\n'
                       'Content-Type: image/jpeg\r\n\r\n').encode() + image + b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), "multipart/form-data; boundary=" + boundary


def check(condition, message):
    if not condition:
        raise RuntimeError(message)
    CHECKS.append(message)
    print("PASS: " + message, flush=True)


def fetch_image(url):
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return response.status, response.headers.get("Content-Type"), response.read()
    except urllib.error.HTTPError as error:
        return error.code, None, b""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--identity", default="http://127.0.0.1:8081")
    parser.add_argument("--marketplace", default="http://127.0.0.1:8082")
    parser.add_argument("--cake-ai", default="http://127.0.0.1:8085")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    arguments = parser.parse_args()
    arguments.output_dir.mkdir(parents=True, exist_ok=True)
    evidence = {"startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "checks": []}
    evidence_path = arguments.output_dir / "live-smoke-result.json"

    def save():
        evidence["checks"] = list(CHECKS)
        evidence_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")

    try:
        for base in [arguments.identity, arguments.marketplace, arguments.cake_ai]:
            status, health = api(base, "GET", "/actuator/health/readiness")
            check(status == 200 and health["status"] == "UP", "service ready at " + base)
        users = []
        for label in ["owner", "other"]:
            email = f"live-ai-{label}-{uuid.uuid4().hex[:12]}@example.test"
            password = secrets.token_urlsafe(24)
            status, _ = api(arguments.identity, "POST", "/api/v1/auth/register", body={
                "email": email, "password": password, "displayName": "Cake AI live smoke " + label})
            check(status == 201, "register test customer " + label)
            status, login = api(arguments.identity, "POST", "/api/v1/auth/login", body={"email": email, "password": password})
            check(status == 200, "login test customer " + label)
            users.append(login["data"]["accessToken"])
        token, other_token = users
        needed = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        command = {"requestType": "OPEN_CUSTOM", "title": "[LIVE SMOKE] Gemini + Firebase cake",
                   "description": "Disposable integration test: pastel celebration cake with sugar flowers.",
                   "neededAt": needed.isoformat(), "deliveryCity": "HCM", "deliveryDistrict": "D1"}
        status, created = api(arguments.marketplace, "POST", "/api/v1/cake-requests", token, command)
        check(status == 201, "Marketplace creates DRAFT request")
        request_id = created["data"]["id"]
        evidence["cakeRequestId"] = request_id
        save()

        source = arguments.source.read_bytes()
        upload, upload_type = multipart(image=source, image_part="files")
        status, uploaded = api(arguments.marketplace, "POST", f"/api/v1/cake-requests/{request_id}/images",
                               token, upload, upload_type)
        check(status == 201, "Marketplace uploads reference image to Firebase")
        reference = uploaded["data"][0]
        signed_status, mime, downloaded = fetch_image(reference["url"])
        check(signed_status == 200 and downloaded == source, "Firebase signed reference URL returns original bytes")
        unsigned = urllib.parse.urlsplit(reference["url"])
        public_status, _, _ = fetch_image(urllib.parse.urlunsplit((unsigned.scheme, unsigned.netloc, unsigned.path, "", "")))
        check(public_status in [401, 403], "Firebase object is private without signed query")
        evidence["firebaseReference"] = {"bytes": len(downloaded), "sha256": hashlib.sha256(downloaded).hexdigest(),
                                         "privateHttpStatus": public_status}

        metadata = {"cakeRequestId": request_id, "prompt": "Design a photorealistic two-tier pastel birthday cake with sugar peonies. Use the reference for inspiration. Plain cream background.",
                    "negativePrompt": "people, text, watermark", "generationParameters": {"aspectRatio": "1:1", "numberOfDesigns": 1}}
        body, content_type = multipart(metadata, source)
        key = "live-smoke-" + uuid.uuid4().hex
        status, accepted = api(arguments.cake_ai, "POST", "/api/v1/generation-jobs", token, body, content_type,
                               {"Idempotency-Key": key})
        check(status == 202, "Cake AI accepts durable generation job")
        job_id = accepted["data"]["id"]
        evidence["jobId"] = job_id
        save()
        last_status = None
        deadline = time.monotonic() + 600
        while time.monotonic() < deadline:
            status, response = api(arguments.cake_ai, "GET", f"/api/v1/generation-jobs/{job_id}", token)
            if status != 200:
                raise RuntimeError("Cannot poll job: HTTP " + str(status))
            detail = response["data"]
            state = detail["job"]["status"]
            if state != last_status:
                print("Job state: " + state, flush=True)
                last_status = state
            if state in ["SUCCEEDED", "FAILED", "CANCELLED"]:
                evidence["jobStatus"] = state
                evidence["jobError"] = detail["job"].get("errorMessage")
                save()
                break
            time.sleep(3)
        else:
            raise RuntimeError("Job did not complete within ten minutes; no generation retry was issued")
        check(state == "SUCCEEDED", "real Gemini generation succeeds; error=" + str(evidence["jobError"]))
        design = detail["generatedDesigns"][0]
        evidence["designId"] = design["id"]
        evidence["moderationStatus"] = design["moderationStatus"]
        save()
        check(design["moderationStatus"] == "APPROVED", "automatic output moderation approves cake")
        status, mime, image = fetch_image(design["imageUrl"])
        check(status == 200 and mime.startswith("image/"), "Firebase signed generated image is readable")
        (arguments.output_dir / "cake-ai-firebase-live.jpg").write_bytes(image)
        status, mime, thumb = fetch_image(design["thumbnailUrl"])
        check(status == 200 and mime.startswith("image/"), "Firebase thumbnail is readable")
        (arguments.output_dir / "cake-ai-firebase-live-thumbnail.jpg").write_bytes(thumb)
        evidence["generatedImage"] = {"bytes": len(image), "sha256": hashlib.sha256(image).hexdigest(), "thumbnailBytes": len(thumb)}
        status, replay = api(arguments.cake_ai, "POST", "/api/v1/generation-jobs", token, body, content_type,
                             {"Idempotency-Key": key})
        check(status == 202 and replay["data"] == accepted["data"], "idempotent replay preserves same job and response")
        status, _ = api(arguments.cake_ai, "GET", f"/api/v1/generation-jobs/{job_id}", other_token)
        check(status == 403, "other customer cannot read AI job")
        status, _ = api(arguments.cake_ai, "GET", f"/api/v1/generated-designs/{design['id']}", other_token)
        check(status == 403, "other customer cannot read design")
        status, _ = api(arguments.cake_ai, "GET", "/api/v1/generation-jobs")
        check(status == 401, "anonymous caller cannot read AI jobs")
        status, selected = api(arguments.marketplace, "PUT", f"/api/v1/cake-requests/{request_id}/selected-design",
                               token, {"generatedDesignId": design["id"]})
        check(status == 200 and selected["data"]["selectedDesignId"] == design["id"],
              "Marketplace selects design through authenticated Cake AI validation (HTTP " + str(status) + ")")
        status, persisted = api(arguments.marketplace, "GET", f"/api/v1/cake-requests/{request_id}", token)
        check(status == 200 and persisted["data"]["selectedDesignId"] == design["id"], "Marketplace persists selectedDesignId")
        evidence["selectedDesignId"] = persisted["data"]["selectedDesignId"]
        evidence["result"] = "PASSED"
        save()
        print("All live checks passed. Evidence: " + str(evidence_path), flush=True)
    except Exception as error:
        evidence["result"] = "FAILED"
        evidence["failure"] = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        save()
        print("Live smoke failed: " + evidence["failure"], flush=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
