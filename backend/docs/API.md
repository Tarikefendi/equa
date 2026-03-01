# API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## Endpoints

### Health Check
**GET** `/health`

Check if API is running.

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

---

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!@#"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!@#"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

---

### Get Profile
**GET** `/auth/profile`

Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "reputation_score": 0,
    "full_name": null,
    "bio": null,
    "avatar_url": null,
    "country": null,
    "language": "en",
    "created_at": "2024-01-30T10:00:00.000Z"
  }
}
```

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [] // Optional validation errors
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
