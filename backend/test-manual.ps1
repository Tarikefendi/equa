# Boycott Platform API Test Script
# PowerShell test script

$baseUrl = "http://localhost:3000/api/v1"

Write-Host "=== Boycott Platform API Tests ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Health Check: $($response.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Health Check Failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Register User
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow
$registerData = @{
    email = "test@example.com"
    username = "testuser"
    password = "Test123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "✓ User Registered: $($response.message)" -ForegroundColor Green
    Write-Host "  User ID: $($response.data.user.id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Registration Failed (might already exist): $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Test 3: Login
Write-Host "3. Testing User Login..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $response.data.token
    Write-Host "✓ Login Successful!" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    # Save token for next tests
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Test 4: Get Profile
    Write-Host "4. Testing Get Profile..." -ForegroundColor Yellow
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method Get -Headers $headers
    Write-Host "✓ Profile Retrieved!" -ForegroundColor Green
    Write-Host "  Username: $($profile.data.username)" -ForegroundColor Gray
    Write-Host "  Email: $($profile.data.email)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 5: Create Campaign
    Write-Host "5. Testing Create Campaign..." -ForegroundColor Yellow
    $campaignData = @{
        title = "Test Campaign $(Get-Date -Format 'HHmmss')"
        description = "This is a test campaign created by automated test"
        target_entity = "Test Company"
        target_type = "company"
        category = "environment"
        tags = @("test", "environment", "automated")
    } | ConvertTo-Json
    
    $campaign = Invoke-RestMethod -Uri "$baseUrl/campaigns" -Method Post -Body $campaignData -Headers $headers
    $campaignId = $campaign.data.id
    Write-Host "✓ Campaign Created!" -ForegroundColor Green
    Write-Host "  Campaign ID: $campaignId" -ForegroundColor Gray
    Write-Host "  Title: $($campaign.data.title)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 6: Get All Campaigns
    Write-Host "6. Testing Get All Campaigns..." -ForegroundColor Yellow
    $campaigns = Invoke-RestMethod -Uri "$baseUrl/campaigns" -Method Get
    Write-Host "✓ Campaigns Retrieved!" -ForegroundColor Green
    Write-Host "  Total Campaigns: $($campaigns.data.Count)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 7: Vote on Campaign
    Write-Host "7. Testing Vote on Campaign..." -ForegroundColor Yellow
    $voteData = @{
        campaign_id = $campaignId
        vote_choice = "support"
    } | ConvertTo-Json
    
    $vote = Invoke-RestMethod -Uri "$baseUrl/votes" -Method Post -Body $voteData -Headers $headers
    Write-Host "✓ Vote Cast!" -ForegroundColor Green
    Write-Host "  Vote Choice: $($vote.data.vote_choice)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 8: Get Vote Stats
    Write-Host "8. Testing Get Vote Statistics..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/votes/campaign/$campaignId/stats" -Method Get
    Write-Host "✓ Vote Stats Retrieved!" -ForegroundColor Green
    Write-Host "  Total Votes: $($stats.data.total)" -ForegroundColor Gray
    Write-Host "  Support: $($stats.data.support)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 9: Create Comment
    Write-Host "9. Testing Create Comment..." -ForegroundColor Yellow
    $commentData = @{
        campaign_id = $campaignId
        content = "This is a test comment from automated test"
    } | ConvertTo-Json
    
    $comment = Invoke-RestMethod -Uri "$baseUrl/comments" -Method Post -Body $commentData -Headers $headers
    Write-Host "✓ Comment Created!" -ForegroundColor Green
    Write-Host "  Comment ID: $($comment.data.id)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 10: Get Platform Analytics
    Write-Host "10. Testing Platform Analytics..." -ForegroundColor Yellow
    $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/platform" -Method Get
    Write-Host "✓ Analytics Retrieved!" -ForegroundColor Green
    Write-Host "  Total Users: $($analytics.data.total_users)" -ForegroundColor Gray
    Write-Host "  Total Campaigns: $($analytics.data.total_campaigns)" -ForegroundColor Gray
    Write-Host "  Total Votes: $($analytics.data.total_votes)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 11: Get Badges
    Write-Host "11. Testing Get My Badges..." -ForegroundColor Yellow
    $badges = Invoke-RestMethod -Uri "$baseUrl/badges/my-badges" -Method Get -Headers $headers
    Write-Host "✓ Badges Retrieved!" -ForegroundColor Green
    Write-Host "  Total Badges: $($badges.data.Count)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 12: Get Notifications
    Write-Host "12. Testing Get Notifications..." -ForegroundColor Yellow
    $notifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headers
    Write-Host "✓ Notifications Retrieved!" -ForegroundColor Green
    Write-Host "  Total Notifications: $($notifications.data.Count)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 13: Get Share Links
    Write-Host "13. Testing Get Share Links..." -ForegroundColor Yellow
    $shareLinks = Invoke-RestMethod -Uri "$baseUrl/share/campaign/$campaignId" -Method Get
    Write-Host "✓ Share Links Generated!" -ForegroundColor Green
    Write-Host "  Facebook: $($shareLinks.data.facebook.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "=== All Tests Completed Successfully! ===" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Test Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
}
