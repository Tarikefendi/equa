# API Test Guide

## Base URL
```
http://localhost:3000/api/v1
```

## 1. Health Check
```bash
GET /health
```

## 2. Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Test123!@#"
}
```

## 3. Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```
**Save the token from response!**

## 4. Get Profile
```bash
GET /auth/profile
Authorization: Bearer YOUR_TOKEN
```

## 5. Create Campaign
```bash
POST /campaigns
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Test Campaign",
  "description": "This is a test campaign",
  "target_entity": "Test Company",
  "target_type": "company",
  "category": "environment",
  "tags": ["test", "environment"]
}
```

## 6. Get All Campaigns
```bash
GET /campaigns
```

## 7. Vote on Campaign
```bash
POST /votes
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "campaign_id": "CAMPAIGN_ID",
  "vote_choice": "support"
}
```

## 8. Get Vote Statistics
```bash
GET /votes/campaign/CAMPAIGN_ID/stats
```

## 9. Create Comment
```bash
POST /comments
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "campaign_id": "CAMPAIGN_ID",
  "content": "This is a test comment"
}
```

## 10. Get Campaign Comments
```bash
GET /comments/campaign/CAMPAIGN_ID
```

## 11. Get Notifications
```bash
GET /notifications
Authorization: Bearer YOUR_TOKEN
```

## 12. Get Platform Analytics
```bash
GET /analytics/platform
```

## 13. Get Trending Campaigns
```bash
GET /analytics/trending
```

## 14. Get My Badges
```bash
GET /badges/my-badges
Authorization: Bearer YOUR_TOKEN
```

## 15. Get All Badge Types
```bash
GET /badges/types
```

## 16. Create Milestone
```bash
POST /milestones
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "campaign_id": "CAMPAIGN_ID",
  "title": "Reach 100 votes",
  "description": "Get 100 supporters",
  "target_value": 100
}
```

## 17. Get Share Links
```bash
GET /share/campaign/CAMPAIGN_ID
```

## 18. Track Share
```bash
POST /share/campaign/CAMPAIGN_ID/track
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "platform": "twitter"
}
```

## 19. Create Report
```bash
POST /reports
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "entity_type": "campaign",
  "entity_id": "CAMPAIGN_ID",
  "reason": "inappropriate_content",
  "description": "This campaign contains offensive content"
}
```

## 20. Get Activity Feed
```bash
GET /activities/feed
```

## 21. Export User Data
```bash
GET /export/my-data
Authorization: Bearer YOUR_TOKEN
```

## 22. Get Campaign Analytics
```bash
GET /analytics/campaign/CAMPAIGN_ID
```
