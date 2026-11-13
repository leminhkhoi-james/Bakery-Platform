# Invoked by Test-LocalJwt.ps1 -BakerySubscriptionOnly -WithStorage.
if (-not $WithStorage -or -not $bakeryId) { throw 'Run through Test-LocalJwt.ps1 -WithStorage' }
$bakeryBase = "http://localhost:8082/api/v1/bakeries/$bakeryId"
$file = @{ Part = 'file'; Type = 'image/png'; Bytes = $imageBytes }
$logo = Request-Multipart "$bakeryBase/logo" $owner.Token @{} @($file)
Verify-Image $logo.data.url $imageBytes
$replacement = Request-Multipart "$bakeryBase/logo" $owner.Token @{} @($file)
Verify-Image $replacement.data.url $imageBytes
$old = Invoke-WebRequest -Uri $logo.data.url -SkipHttpErrorCheck -TimeoutSec 15
if ([int]$old.StatusCode -ne 404) { throw 'Replaced logo object was not cleaned up' }
$cover = Request-Multipart "$bakeryBase/cover" $owner.Token @{} @($file)
Verify-Image $cover.data.url $imageBytes
$null = Request-Multipart "$bakeryBase/logo" $customer.Token @{} @($file) 403
$invalidFile = @{ Part = 'file'; Type = 'image/jpeg'; Bytes = $imageBytes }
$null = Request-Multipart "$bakeryBase/logo" $owner.Token @{} @($invalidFile) 400
$largeFile = @{ Part = 'file'; Type = 'image/png'; Bytes = [byte[]]::new(5 * 1024 * 1024 + 1) }
$null = Request-Multipart "$bakeryBase/logo" $owner.Token @{} @($largeFile) 400
$addOn = Request-Json POST "$bakeryBase/add-ons" @{ name = 'Test candle'; category = 'CANDLE'; price = 10000; active = $true } (Auth $owner.Token) 201
$addOnImage = Request-Multipart "$bakeryBase/add-ons/$($addOn.data.id)/image" $owner.Token @{} @($file)
Verify-Image $addOnImage.data.url $imageBytes
Write-Output 'PASS logo replacement cleanup, cover/add-on images, invalid MIME/size and unauthorized uploads'

$null = Request-Json PUT "$bakeryBase/operations" @{
    addresses = @(@{ addressLine = '12 Test street'; city = 'HCM'; district = 'D1'; isPrimary = $true })
    serviceAreas = @(@{ city = 'HCM'; district = 'D1'; deliveryFee = 0; minimumOrder = 0; active = $true })
    businessHours = @(@{ dayOfWeek = 1; opensAt = '08:00:00'; closesAt = '20:00:00'; closed = $false })
} (Auth $owner.Token)
$null = Request-Json POST "$bakeryBase/submit-for-approval" $null (Auth $owner.Token)
$null = Request-Json PATCH "http://localhost:8082/api/v1/admin/bakeries/$bakeryId/status" @{ status = 'ACTIVE' } (Auth $admin.Token)
$createdProducts = @()
foreach ($name in @('A test cake', 'Z test cake')) {
    $product = Request-Json POST "$bakeryBase/products" @{
        name = $name; slug = ($name.ToLower().Replace(' ', '-')); basePrice = 100000; customizable = $true; minimumNoticeHours = 0
    } (Auth $owner.Token) 201
    $createdProducts += $product.data.id
    $images = Request-Multipart "$bakeryBase/products/$($product.data.id)/images?primaryIndex=0" $owner.Token @{
        displayOrder = @(2, 1)
    } @(@{ Part = 'files'; Type = 'image/png'; Bytes = $imageBytes }, @{ Part = 'files'; Type = 'image/png'; Bytes = $imageBytes })
    if ($images.data.Count -ne 2 -or -not $images.data[0].primary -or $images.data[0].displayOrder -ne 2) {
        throw 'Product image primary/display order mismatch'
    }
    Verify-Image $images.data[0].url $imageBytes
    $null = Request-Json POST "$bakeryBase/products/$($product.data.id)/publish" $null (Auth $owner.Token)
    $null = Request-Json DELETE "$bakeryBase/products/$($product.data.id)/images/$($images.data[1].id)" $null (Auth $owner.Token) 204
    $deleted = Invoke-WebRequest -Uri $images.data[1].url -SkipHttpErrorCheck -TimeoutSec 15
    if ([int]$deleted.StatusCode -ne 404) { throw 'Deleted product image still exists' }
}
$management = Request-Json GET "$bakeryBase/products?sort=name,desc&size=1" $null (Auth $owner.Token)
if ($management.data.result[0].id -ne $createdProducts[1]) { throw 'Management product sort failed' }
$public = Request-Json GET "http://localhost:8082/api/v1/products?bakeryId=$bakeryId&sort=name,asc&size=1"
if ($public.data.result[0].product.id -ne $createdProducts[0]) { throw 'Public product sort failed' }
$null = Request-Json GET "http://localhost:8082/api/v1/products?sort=phoneNumber,asc" $null @{} 400
$null = Request-Json GET "http://localhost:8082/api/v1/bakeries?sort=name,desc&query=$runId"
$null = Request-Json GET "http://localhost:8082/api/v1/bakeries?sort=unknown,asc" $null @{} 400
$null = Request-Json GET "http://localhost:8082/api/v1/admin/bakeries?sort=name,desc&query=$runId" $null (Auth $admin.Token)
$null = Request-Json GET "http://localhost:8082/api/v1/admin/bakeries?sort=unknown,asc" $null (Auth $admin.Token) 400
Write-Output 'PASS product multipart upload/delete, primary/display order, publish and public/management sorting'
