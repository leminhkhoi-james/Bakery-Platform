param([switch]$KeepTestData, [switch]$BakerySubscriptionOnly, [switch]$WithStorage)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$config = @{}
foreach ($line in Get-Content .env) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') { $config[$Matches[1]] = $Matches[2].Trim().Trim("'") }
}
$users = [System.Collections.Generic.List[string]]::new()
$bakeryId = $null
$testFailure = $null
$runId = [guid]::NewGuid().ToString('N')
$password = [guid]::NewGuid().ToString('N') + '!aA1'
function Request-Json($Method, $Uri, $Body = $null, $Headers = @{}, $Expected = 200) {
    $parameters = @{ Method = $Method; Uri = $Uri; Headers = $Headers; TimeoutSec = 30; SkipHttpErrorCheck = $true }
    if ($null -ne $Body) { $parameters.Body = ConvertTo-Json $Body -Depth 12; $parameters.ContentType = 'application/json' }
    $response = Invoke-WebRequest @parameters
    if ([int]$response.StatusCode -ne $Expected) { throw "HTTP $($response.StatusCode), expected $Expected at $Uri" }
    if ($response.Content) { return $response.Content | ConvertFrom-Json }
}
function Auth($Token) { return @{ Authorization = "Bearer $Token" } }
function Request-Multipart($Uri, $Token, $Fields, $Files, $Expected = 201, $Key = $null) {
    $http = [System.Net.Http.HttpClient]::new()
    $form = [System.Net.Http.MultipartFormDataContent]::new()
    try {
        foreach ($field in $Fields.GetEnumerator()) {
            $form.Add([System.Net.Http.StringContent]::new(($field.Value | ConvertTo-Json -Depth 8 -Compress),
                    [System.Text.Encoding]::UTF8, 'application/json'), $field.Key)
        }
        foreach ($file in $Files) {
            $part = [System.Net.Http.ByteArrayContent]::new([byte[]]$file.Bytes)
            $part.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new($file.Type)
            $form.Add($part, $file.Part, 'test.png')
        }
        $http.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
        if ($Key) { $http.DefaultRequestHeaders.Add('Idempotency-Key', $Key) }
        $response = $http.PostAsync($Uri, $form).GetAwaiter().GetResult()
        if ([int]$response.StatusCode -ne $Expected) { throw "Multipart HTTP $([int]$response.StatusCode), expected $Expected" }
        $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if ($content) { return $content | ConvertFrom-Json }
    } finally { $form.Dispose(); $http.Dispose() }
}
function Verify-Image($Url, [byte[]]$Expected) {
    $http = [System.Net.Http.HttpClient]::new()
    try {
        $actual = $http.GetByteArrayAsync($Url).GetAwaiter().GetResult()
        if ([Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($actual)) -ne
                [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($Expected))) {
            throw 'Downloaded media differs from upload'
        }
    } finally { $http.Dispose() }
}
function Remove-TestObject($Service, $Bucket, $ObjectKey) {
    # Sign DELETE using S3 V4; keys are queried only for this run's bakery/order.
    $prefix = if ($Service -eq 'bakery') { 'BAKERY' } else { 'SUBSCRIPTION' }
    $port = if ($Service -eq 'bakery') { '9002' } else { '9004' }
    $endpoint = "http://localhost:$port"
    $access = if ($config["${prefix}_MINIO_ACCESS_KEY"]) { $config["${prefix}_MINIO_ACCESS_KEY"] } else { 'minioadmin' }
    $secret = if ($config["${prefix}_MINIO_SECRET_KEY"]) { $config["${prefix}_MINIO_SECRET_KEY"] } else { 'minioadmin' }
    $region = if ($config.STORAGE_MINIO_REGION) { $config.STORAGE_MINIO_REGION } else { 'us-east-1' }
    $date = [datetime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
    $day = $date.Substring(0, 8)
    $path = '/' + $Bucket + '/' + (($ObjectKey.Split('/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
    $emptyHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData([byte[]]@())).ToLowerInvariant()
    $headers = "host;x-amz-content-sha256;x-amz-date"
    $canonical = "DELETE`n$path`n`nhost:localhost:$port`nx-amz-content-sha256:$emptyHash`nx-amz-date:$date`n`n$headers`n$emptyHash"
    $hash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($canonical))).ToLowerInvariant()
    $scope = "$day/$region/s3/aws4_request"
    [byte[]]$signingKey = [Text.Encoding]::UTF8.GetBytes("AWS4$secret")
    foreach ($value in @($day, $region, 's3', 'aws4_request')) {
        $signingKey = [System.Security.Cryptography.HMACSHA256]::HashData($signingKey, [Text.Encoding]::UTF8.GetBytes($value))
    }
    $signature = [Convert]::ToHexString([System.Security.Cryptography.HMACSHA256]::HashData($signingKey,
            [Text.Encoding]::UTF8.GetBytes("AWS4-HMAC-SHA256`n$date`n$scope`n$hash"))).ToLowerInvariant()
    $null = Invoke-WebRequest -Method DELETE -Uri ($endpoint + $path) -TimeoutSec 15 -SkipHeaderValidation -Headers @{
        Authorization = "AWS4-HMAC-SHA256 Credential=$access/$scope, SignedHeaders=$headers, Signature=$signature"
        'x-amz-content-sha256' = $emptyHash; 'x-amz-date' = $date
    }
}
function Database-Sql($Service, $User, $Database, $Sql) {
    $Sql | docker compose -f compose.yaml -f docker-compose.bakery-subscription.yml -f docker-compose.order-service.yml -f docker-compose.chat-service.yml -f compose.services.yaml -f compose.no-firebase.yaml exec -T $Service psql -U $User -d $Database -v ON_ERROR_STOP=1 -q > $null
    if ($LASTEXITCODE -ne 0) { throw "Database verification failed: $Service" }
}
function New-TestUser($Name, $Role) {
    $email = "jwt-$Name-$runId@example.test"
    $registered = Request-Json POST 'http://localhost:8081/api/v1/auth/register' @{ email = $email; password = $password; displayName = "JWT test $Name" } @{} 201
    $id = ([guid]$registered.data.id).ToString()
    $users.Add($id)
    if ($Role) {
        if ($Role -notin @('BAKERY_OWNER','BAKERY_STAFF','ADMIN')) { throw 'Invalid test role' }
        Database-Sql identity-db $config.IDENTITY_DB_USERNAME identity_db "INSERT INTO user_roles(user_id,role_id) SELECT '$id',id FROM roles WHERE code='$Role' ON CONFLICT DO NOTHING;"
    }
    $login = Request-Json POST 'http://localhost:8081/api/v1/auth/login' @{ email = $email; password = $password }
    return @{ Id = $id; Token = $login.data.accessToken }
}
function Service-Jwt($Client, $Secret, $Audience, $Scope) {
    $response = Request-Json POST 'http://localhost:8081/internal/v1/auth/service-token' @{ clientId = $Client; clientSecret = $Secret; audience = $Audience; scope = $Scope }
    if (-not $response.accessToken) { throw 'Missing service token' }
    return $response.accessToken
}
try {
    $jwk = Request-Json GET 'http://localhost:8081/.well-known/jwks.json'
    $publicKey = [System.Security.Cryptography.RSA]::Create()
    try {
        $publicKey.ImportFromPem([System.IO.File]::ReadAllText($config.IDENTITY_JWT_PUBLIC_KEY_FILE))
        $modulus = [Convert]::ToBase64String($publicKey.ExportParameters($false).Modulus).TrimEnd('=').Replace('+','-').Replace('/','_')
        if ($modulus -notin $jwk.keys.n) { throw 'Identity JWK does not match the configured public key' }
    } finally { $publicKey.Dispose() }
    Write-Output 'PASS Identity JWK matches the supplied public PEM'
    $owner = New-TestUser owner BAKERY_OWNER
    $admin = New-TestUser admin ADMIN
    $staff = New-TestUser staff BAKERY_STAFF
    $customer = New-TestUser customer $null
    $null = Request-Json GET 'http://localhost:8081/api/v1/auth/me' $null (Auth $owner.Token)
    Write-Output 'PASS register/login and user JWT'
    $bakery = Request-Json POST 'http://localhost:8082/api/v1/bakeries' @{ name = "JWT test $runId"; phoneNumber = '0900000000' } (Auth $owner.Token) 201
    $bakeryId = ([guid]$bakery.data.id).ToString()
    $member = Request-Json POST "http://localhost:8082/api/v1/bakeries/$bakeryId/members" @{ userId = $staff.Id; memberRole = 'STAFF' } (Auth $owner.Token) 201
    if ($member.data.displayNameSnapshot -ne 'JWT test staff') { throw 'Missing member display snapshot' }
    $members = Request-Json GET "http://localhost:8082/api/v1/bakeries/$bakeryId/members" $null (Auth $owner.Token)
    if (@($members.data | Where-Object { $_.userId -eq $owner.Id })[0].displayNameSnapshot -ne 'JWT test owner') {
        throw 'Missing owner display snapshot'
    }
    Write-Output 'PASS Bakery validates user JWT and obtains Identity service JWT for member lookup'
    $null = Request-Json GET "http://localhost:8082/api/v1/bakeries/$bakeryId/members" $null (Auth $customer.Token) 403
    $parts = $owner.Token.Split('.')
    $parts[2] = $(if ($parts[2][0] -eq 'a') { 'b' } else { 'a' }) + $parts[2].Substring(1)
    $null = Request-Json GET "http://localhost:8082/api/v1/bakeries/$bakeryId/members" $null (Auth ($parts -join '.')) 401
    Write-Output 'PASS ownership checks and tampered JWT rejection'
    $plans = Request-Json GET 'http://localhost:8084/api/v1/subscription-plans'
    $plan = @($plans.data)[0]
    $orderHeaders = Auth $owner.Token
    $orderHeaders['Idempotency-Key'] = [guid]::NewGuid().ToString()
    $order = Request-Json POST "http://localhost:8084/api/v1/bakeries/$bakeryId/subscription-orders" @{ planId = $plan.id } $orderHeaders 201
    Write-Output 'PASS Subscription validates owner through Bakery using an automatically issued service JWT'
    $imageBytes = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=')
    $metadata = @{ paymentMethod = 'BANK_TRANSFER'; paymentReference = "JWT-$runId"; amount = $order.data.totalAmount; currency = 'VND' }
    $proofs = if ($WithStorage) { @(@{ Part = 'proof'; Type = 'image/png'; Bytes = $imageBytes }) } else { @() }
    $payment = Request-Multipart "http://localhost:8084/api/v1/subscription-orders/$($order.data.id)/payments" $owner.Token @{ metadata = $metadata } $proofs 201 ([guid]::NewGuid().ToString())
    if ($WithStorage) {
        Verify-Image $payment.data.proofUrl $imageBytes
        $staffOrder = Request-Json GET "http://localhost:8084/api/v1/subscription-orders/$($order.data.id)" $null (Auth $staff.Token)
        if ($staffOrder.data.payments[0].proofUrl) { throw 'Payment proof exposed to staff' }
        $queue = Request-Json GET "http://localhost:8084/api/v1/admin/bakery-payments?bakeryId=$bakeryId" $null (Auth $admin.Token)
        Verify-Image $queue.data.result[0].proofUrl $imageBytes
        Write-Output 'PASS proof upload, signed download and owner/admin visibility; staff cannot view proof'
    }
    $adminHeaders = Auth $admin.Token
    $adminHeaders['Idempotency-Key'] = [guid]::NewGuid().ToString()
    $approval = Request-Json POST "http://localhost:8084/api/v1/admin/bakery-payments/$($payment.data.id)/approve" @{ reviewNote = 'Local JWT verification' } $adminHeaders
    if ($approval.data.subscription.status -ne 'ACTIVE') { throw 'Approved subscription is not active' }
    $detail = Request-Json GET "http://localhost:8082/api/v1/admin/bakeries/$bakeryId" $null (Auth $admin.Token)
    if (-not $detail.data.subscription.active) { throw 'Bakery did not receive active entitlement' }
    Write-Output 'PASS admin approval and Bakery-to-Subscription entitlement service JWT'
    if ($WithStorage) {
        . (Join-Path $PSScriptRoot 'Test-BakeryMedia.ps1')
    }
    if (-not $BakerySubscriptionOnly) {
    foreach ($uri in @('http://localhost:8083/api/v1/cake-requests','http://localhost:8086/api/v1/orders','http://localhost:8087/api/v1/conversations')) {
        $null = Request-Json GET $uri $null (Auth $customer.Token)
        Write-Output "PASS user JWT at $uri"
    }
    $aiToken = Service-Jwt marketplace-service $config.MARKETPLACE_CLIENT_SECRET cake-ai-service 'cake-ai:design:validate'
    $aiHeaders = Auth $aiToken
    $aiHeaders['X-Correlation-Id'] = $runId
    $null = Request-Json GET "http://localhost:8085/internal/v1/cake-requests/$bakeryId/generation-context" $null $aiHeaders
    $null = Request-Json GET "http://localhost:8084/internal/v1/subscriptions/bakeries/$bakeryId/entitlement" $null $aiHeaders 401
    Write-Output 'PASS Cake AI service JWT and wrong-audience rejection'
    }
    Write-Output 'JWT VERIFICATION PASSED; no tokens or secrets printed'
} catch {
    $testFailure = $_
} finally {
    try {
    if (-not $KeepTestData) {
        if ($bakeryId) {
            if ($WithStorage) {
                $bakeryKeys = docker compose -f docker-compose.bakery-subscription.yml exec -T bakery-db psql -U postgres -d bakery_db -At -c "SELECT logo_object_key FROM bakeries WHERE id='$bakeryId' UNION SELECT cover_object_key FROM bakeries WHERE id='$bakeryId' UNION SELECT image_object_key FROM add_ons WHERE bakery_id='$bakeryId' UNION SELECT i.object_key FROM product_images i JOIN products p ON p.id=i.product_id WHERE p.bakery_id='$bakeryId';"
                if ($LASTEXITCODE -ne 0) { throw 'Could not list this run media for cleanup' }
                foreach ($key in $bakeryKeys) { if ($key) { Remove-TestObject bakery bakery-media $key } }
                $proofKeys = docker compose -f docker-compose.bakery-subscription.yml exec -T subscription-db psql -U postgres -d subscription_db -At -c "SELECT proof_object_key FROM bakery_payments WHERE subscription_order_id IN (SELECT id FROM subscription_orders WHERE bakery_id='$bakeryId');"
                if ($LASTEXITCODE -ne 0) { throw 'Could not list this run proofs for cleanup' }
                foreach ($key in $proofKeys) { if ($key) { Remove-TestObject subscription subscription-proofs $key } }
            }
            Database-Sql subscription-db postgres subscription_db "BEGIN; DELETE FROM bakery_payments WHERE subscription_order_id IN (SELECT id FROM subscription_orders WHERE bakery_id='$bakeryId'); DELETE FROM bakery_subscriptions WHERE bakery_id='$bakeryId'; DELETE FROM subscription_orders WHERE bakery_id='$bakeryId'; COMMIT;"
            Database-Sql bakery-db postgres bakery_db "DELETE FROM bakeries WHERE id='$bakeryId';"
        }
        if ($users.Count -gt 0) {
            $ids = ($users | ForEach-Object { "'$_'" }) -join ','
            Database-Sql identity-db $config.IDENTITY_DB_USERNAME identity_db "DELETE FROM users WHERE id IN ($ids);"
        }
        Write-Output 'Test users and bakery data removed'
    }
    } catch {
        if ($testFailure) { Write-Warning 'Test-data cleanup also failed; original test failure is retained.' }
        else { $testFailure = $_ }
    }
}
if ($testFailure) { throw $testFailure }
