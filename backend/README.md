# Boycott Platform - Democratic Activism Platform

A secure, transparent, and community-driven platform for organizing boycott campaigns and collective action.

## 🚀 Features

### ✅ Authentication & User Management
- User registration and login with JWT
- Email verification system
- Password reset functionality
- User profiles with reputation scores
- Role-based access control (User, Moderator, Admin)

### ✅ Campaign Management
- Create, read, update, delete campaigns
- Campaign status workflow (draft, under_review, active, concluded)
- Campaign categories and tags
- Search and filter campaigns
- Target types: company, brand, government
- Campaign milestones with progress tracking

### ✅ Voting System
- Vote on campaigns (support, oppose, neutral)
- Real-time vote statistics
- Vote history tracking
- Anonymous voting with hash verification

### ✅ Comments & Discussions
- Comment on campaigns
- Nested replies (threaded comments)
- Edit and delete own comments
- Soft delete for moderation

### ✅ Image Upload
- Upload campaign images
- Multiple image support
- File type validation (JPEG, PNG, GIF, WebP)
- 5MB file size limit
- Secure file storage

### ✅ Notifications System
- Real-time notifications
- Notification types: comments, votes, badges, milestones
- Mark as read/unread
- Unread count tracking
- Delete notifications

### ✅ Report & Moderation
- Report inappropriate content
- Report status tracking (pending, reviewing, resolved, rejected)
- Moderator review system
- User report history

### ✅ Badges & Achievements
- 9 different badge types
- Automatic badge awarding
- Badge progress tracking
- Achievement notifications
- Badge types:
  - Campaign Creator (first campaign)
  - Activist (10 campaigns)
  - Voter (first vote)
  - Democracy Champion (100 votes)
  - Commentator (first comment)
  - Verified User (email verified)
  - Trusted Member (100 reputation)
  - Community Leader (500 reputation)
  - Early Adopter (joined early)

### ✅ Campaign Milestones
- Create custom milestones
- Track progress automatically
- Milestone completion notifications
- Visual progress indicators

### ✅ Analytics & Statistics
- Platform-wide statistics
- Campaign analytics (votes, comments, views, shares)
- User analytics (campaigns, votes, comments, badges)
- Trending campaigns
- Category statistics
- Engagement rate calculation

### ✅ Social Sharing
- Share campaigns on social media
- Supported platforms: Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Reddit, Email
- Share tracking
- Share count by platform

### ✅ Data Export
- Export user data (GDPR compliance)
- Export campaign data
- CSV export for campaigns
- CSV export for votes
- JSON format support

### ✅ Activity Feed
- Track user activities
- Campaign activity logs
- Entity-based activity tracking
- Public activity feed

### ✅ Security & Moderation
- Rate limiting on sensitive endpoints
- Input validation with express-validator
- Role-based permissions
- Moderator tools
- Activity logging for audit

## 🛠️ Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn

## 🔧 Installation

1. Clone the repository
```bash
git clone <repository-url>
cd boycott-platform
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Setup database
```bash
npm run migrate
npm run seed
```

5. Start development server
```bash
npm run dev
```

## 📁 Project Structure

```
boycott-platform/
├── src/
│   ├── config/          # Configuration files (database, logger, email, upload, swagger)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware (auth, roleCheck, rateLimiter, errorHandler)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions (jwt, validation)
│   ├── types/           # TypeScript types
│   ├── database/        # Database migrations & seeds
│   └── server.ts        # Application entry point
├── uploads/             # Uploaded files
├── logs/                # Application logs
└── docs/                # Documentation
```

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT-based authentication (access + refresh tokens)
- Rate limiting on auth endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Role-based access control
- Activity logging for audit trails

## 📚 API Documentation

API documentation is available at `http://localhost:3000/api/v1/docs` when the server is running.

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/profile` - Get user profile
- `GET /api/v1/auth/verify-email` - Verify email
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

#### Campaigns
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - List campaigns (with filters)
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PUT /api/v1/campaigns/:id` - Update campaign
- `DELETE /api/v1/campaigns/:id` - Delete campaign
- `GET /api/v1/campaigns/my-campaigns` - Get user's campaigns

#### Comments
- `POST /api/v1/comments` - Create comment
- `GET /api/v1/comments/campaign/:campaignId` - Get campaign comments
- `GET /api/v1/comments/:commentId/replies` - Get comment replies
- `PUT /api/v1/comments/:id` - Update comment
- `DELETE /api/v1/comments/:id` - Delete comment

#### Votes
- `POST /api/v1/votes` - Cast or update vote
- `DELETE /api/v1/votes/campaign/:campaignId` - Remove vote
- `GET /api/v1/votes/campaign/:campaignId/stats` - Get vote statistics
- `GET /api/v1/votes/campaign/:campaignId/my-vote` - Get user's vote
- `GET /api/v1/votes/campaign/:campaignId/voters` - Get campaign voters

#### Uploads
- `POST /api/v1/uploads/image` - Upload single image
- `POST /api/v1/uploads/images` - Upload multiple images
- `GET /api/v1/uploads/entity/:entityType/:entityId` - Get entity uploads
- `DELETE /api/v1/uploads/:id` - Delete upload
- `GET /api/v1/uploads/my-uploads` - Get user's uploads

#### Activities
- `GET /api/v1/activities/feed` - Get activity feed
- `GET /api/v1/activities/my-activities` - Get user's activities
- `GET /api/v1/activities/entity/:entityType/:entityId` - Get entity activities

#### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

#### Reports
- `POST /api/v1/reports` - Create report
- `GET /api/v1/reports` - Get all reports (moderator)
- `GET /api/v1/reports/:id` - Get report by ID (moderator)
- `PUT /api/v1/reports/:id/status` - Update report status (moderator)
- `GET /api/v1/reports/my-reports` - Get user's reports

#### Badges
- `GET /api/v1/badges/types` - Get all badge types
- `GET /api/v1/badges/my-badges` - Get user's badges
- `GET /api/v1/badges/user/:userId` - Get specific user's badges

#### Milestones
- `POST /api/v1/milestones` - Create milestone
- `GET /api/v1/milestones/campaign/:campaignId` - Get campaign milestones
- `PUT /api/v1/milestones/:id/progress` - Update milestone progress
- `DELETE /api/v1/milestones/:id` - Delete milestone

#### Analytics
- `GET /api/v1/analytics/platform` - Platform statistics
- `GET /api/v1/analytics/campaign/:campaignId` - Campaign analytics
- `GET /api/v1/analytics/user/:userId` - User analytics
- `GET /api/v1/analytics/my-analytics` - My analytics
- `GET /api/v1/analytics/trending` - Trending campaigns
- `GET /api/v1/analytics/categories` - Category statistics

#### Social Sharing
- `GET /api/v1/share/campaign/:campaignId` - Get share links
- `POST /api/v1/share/campaign/:campaignId/track` - Track share
- `GET /api/v1/share/campaign/:campaignId/count` - Get share count

#### Data Export
- `GET /api/v1/export/my-data` - Export user data (GDPR)
- `GET /api/v1/export/campaign/:campaignId` - Export campaign data
- `GET /api/v1/export/campaigns/csv` - Export campaigns CSV (moderator)
- `GET /api/v1/export/campaign/:campaignId/votes/csv` - Export votes CSV

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Boycott Platform" <noreply@boycott.com>
APP_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3001
```

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please read our contributing guidelines first.

