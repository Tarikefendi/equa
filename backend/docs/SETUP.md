# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v7 or higher)
- **npm** or **yarn**

---

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd boycott-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup PostgreSQL Database

Create a new database:
```bash
psql -U postgres
CREATE DATABASE boycott_platform;
\q
```

### 4. Setup Redis

Start Redis server:
```bash
# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis

# On Windows
redis-server
```

### 5. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boycott_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_token_secret
```

### 6. Run Database Migrations
```bash
npm run migrate
```

### 7. Seed Database (Optional)
```bash
npm run seed
```

This creates a demo user:
- Email: `demo@boycott.com`
- Password: `Demo123!@#`

### 8. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

### Redis Connection Error
- Ensure Redis is running
- Check Redis configuration in `.env`

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using port 3000

---

## Next Steps

- Read the [API Documentation](./API.md)
- Explore the project structure
- Start building new features!
