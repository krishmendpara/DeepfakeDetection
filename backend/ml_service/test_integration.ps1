$registerUrl = "http://localhost:5000/api/auth/register"
$loginUrl = "http://localhost:5000/api/auth/login"
$predictUrl = "http://localhost:5000/api/predict"
$imagePath = "D:\DeepfakeDetection\server\uploads\image-1785949716422.jpg"

# 1. Register User
$regBody = @{
    username = "testuser"
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Registering user..."
try {
    $regResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType "application/json" -Body $regBody
    Write-Host "Register response:" ($regResponse | ConvertTo-Json -Depth 4)
} catch {
    Write-Host "Register failed or already exists. Proceeding to login."
}

# 2. Login User
$loginBody = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Logging in..."
$loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
Write-Host "Login token obtained."

# 3. Predict Image
Write-Host "Uploading image for prediction..."
$headers = @{
    Authorization = "Bearer " + $loginResponse.token
}

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
$fileName = [System.IO.Path]::GetFileName($imagePath)

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"image`"; filename=`"$fileName`"",
    "Content-Type: image/jpeg",
    "",
    [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes),
    "--$boundary--"
) -join $LF

$postBody = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetBytes($bodyLines)

$predictResponse = Invoke-RestMethod -Uri $predictUrl -Method Post -Headers $headers -ContentType ("multipart/form-data; boundary=" + $boundary) -Body $postBody
Write-Host "Predict response:" ($predictResponse | ConvertTo-Json -Depth 4)
