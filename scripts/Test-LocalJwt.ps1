param([switch]$KeepTestData)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$config = @{}
foreach ($line in Get-Content .env) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') { $config[$Matches[1]] = $Matches[2].Trim().Trim("'") }
}
$users = [System.Collections.Generic.List[string]]::new()
$bakeryId = $null
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
        if ($Role -notin @('BAKERY_OWNER','ADMIN')) { throw 'Invalid test role' }
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
    $customer = New-TestUser customer $null
    $null = Request-Json GET 'http://localhost:8081/api/v1/auth/me' $null (Auth $owner.Token)
    Write-Output 'PASS register/login and user JWT'
    $bakery = Request-Json POST 'http://localhost:8082/api/v1/bakeries' @{ name = "JWT test $runId"; phoneNumber = '0900000000' } (Auth $owner.Token) 201
    $bakeryId = ([guid]$bakery.data.id).ToString()
    $null = Request-Json GET "http://localhost:8082/api/v1/bakeries/$bakeryId/members" $null (Auth $owner.Token)
    Write-Output 'PASS Bakery validates owner JWT and owner membership'
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
    $http = [System.Net.Http.HttpClient]::new()
    $form = [System.Net.Http.MultipartFormDataContent]::new()
    try {
        $metadata = @{ paymentMethod = 'BANK_TRANSFER'; paymentReference = "JWT-$runId"; amount = $order.data.totalAmount; currency = 'VND' } | ConvertTo-Json
        $form.Add([System.Net.Http.StringContent]::new($metadata,[System.Text.Encoding]::UTF8,'application/json'),'metadata')
        $http.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$owner.Token)
        $http.DefaultRequestHeaders.Add('Idempotency-Key',[guid]::NewGuid().ToString())
        $response = $http.PostAsync("http://localhost:8084/api/v1/subscription-orders/$($order.data.id)/payments",$form).GetAwaiter().GetResult()
        if ([int]$response.StatusCode -ne 201) { throw "Payment submission HTTP $([int]$response.StatusCode)" }
        $payment = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
    } finally { $form.Dispose(); $http.Dispose() }
    $adminHeaders = Auth $admin.Token
    $adminHeaders['Idempotency-Key'] = [guid]::NewGuid().ToString()
    $approval = Request-Json POST "http://localhost:8084/api/v1/admin/bakery-payments/$($payment.data.id)/approve" @{ reviewNote = 'Local JWT verification' } $adminHeaders
    if ($approval.data.subscription.status -ne 'ACTIVE') { throw 'Approved subscription is not active' }
    $detail = Request-Json GET "http://localhost:8082/api/v1/admin/bakeries/$bakeryId" $null (Auth $admin.Token)
    if (-not $detail.data.subscription.active) { throw 'Bakery did not receive active entitlement' }
    Write-Output 'PASS admin approval and Bakery-to-Subscription entitlement service JWT'
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
    Write-Output 'JWT VERIFICATION PASSED; no tokens or secrets printed'
} finally {
    if (-not $KeepTestData) {
        if ($bakeryId) {
            Database-Sql subscription-db postgres subscription_db "BEGIN; DELETE FROM bakery_payments WHERE subscription_order_id IN (SELECT id FROM subscription_orders WHERE bakery_id='$bakeryId'); DELETE FROM bakery_subscriptions WHERE bakery_id='$bakeryId'; DELETE FROM subscription_orders WHERE bakery_id='$bakeryId'; COMMIT;"
            Database-Sql bakery-db postgres bakery_db "DELETE FROM bakeries WHERE id='$bakeryId';"
        }
        if ($users.Count -gt 0) {
            $ids = ($users | ForEach-Object { "'$_'" }) -join ','
            Database-Sql identity-db $config.IDENTITY_DB_USERNAME identity_db "DELETE FROM users WHERE id IN ($ids);"
        }
        Write-Output 'Test users and bakery data removed'
    }
}
