<p align="center">
  <img width="155" src="src/frontend/assets/logo/logo.png" style="border-radius: 100px;" />
</p>

<h1 align="center">Lumaris</h1>

<p align="center">
  <video
    src="https://github.com/user-attachments/assets/31288a2f-e32e-4255-b512-7a6fe9c025a8"
    width="80%"
    controls
    playsinline>
  </video>
</p>

<p align="center">
  <strong>Plateforme éducative intelligente pour la gestion scolaire et l'apprentissage assisté par IA</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API Documentation</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Development](#-development)
- [Testing](#-testing)
- [Security](#-security)
- [Performance](#-performance)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

Lumaris is a comprehensive educational platform built on Cloudflare Workers that provides students with intelligent tools for academic management. The platform integrates with French school systems (ÉcoleDirecte), offers AI-powered study assistance, and provides a complete workspace for organizing academic life.

### Key Capabilities

- **School Integration**: Seamless integration with ÉcoleDirecte for grades, homework, and timetable
- **AI-Powered Learning**: Intelligent tutoring and study assistance using Cloudflare Workers AI
- **Workspace Management**: Complete file management, study notes, and organizational tools
- **Real-time Notifications**: Email notifications for important academic events
- **Customizable Interface**: Personalized dashboard with extensive customization options
- **Secure Authentication**: Enterprise-grade authentication with Supabase and Turnstile

---

## ✨ Features

### Academic Management
- **Grade Tracking**: Real-time monitoring of academic performance with automated grade checking workflows
- **Homework Management**: Automated homework assignment tracking and reminders
- **Timetable Integration**: Complete schedule management with ÉcoleDirecte synchronization
- **Attendance Records**: Detailed attendance tracking and reporting

### AI-Powered Tools
- **Intelligent Tutoring**: Context-aware AI assistance for homework and study questions
- **Web Search Integration**: Real-time web search for comprehensive research
- **Image Analysis**: AI-powered image recognition for visual learning materials
- **Note Generation**: Automated study note creation and organization

### Productivity Tools
- **Pomodoro Timer**: Integrated time management for focused study sessions
- **File Management**: Complete cloud storage solution with MEGA integration
- **Study Notes**: Advanced note-taking with organization and search capabilities
- **Website Blocking**: Productivity-focused website management

### User Experience
- **Responsive Design**: Mobile-first approach with excellent cross-device compatibility
- **Dark Mode**: Built-in theme switching with extensive customization
- **Real-time Updates**: Live data synchronization across all devices
- **Accessibility**: WCAG AA compliant interface design

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Supabase   │  │  Turnstile   │      │
│  │   (Assets)   │  │   Auth       │  │  CAPTCHA     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Workers                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Main API   │  │   Workflows  │  │   AI Service │      │
│  │   Handler    │  │   (Cron)     │  │   (Workers   │      │
│  │              │  │              │  │    AI)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ÉcoleDirecte│  │    Cache     │  │  Notification│      │
│  │  Integration │  │   (KV)       │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Storage                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  D1 Database │  │  KV Storage  │  │  R2 Storage  │      │
│  │  (Settings)  │  │  (Deleted    │  │  (Files)     │      │
│  │              │  │   Chats)     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ÉcoleDirecte │  │   MEGA.nz    │  │  Email SMTP  │      │
│  │    API       │  │   Storage    │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**: User → Supabase Auth → JWT Token → API Verification
2. **API Requests**: Frontend → Cloudflare Worker → Service Layer → External APIs
3. **Workflow Execution**: Cron Trigger → Workflow → Grade Check → Notification
4. **AI Processing**: User Query → Workers AI → Response Generation → Caching

---

## 🛠️ Tech Stack

### Core Platform
- **Cloudflare Workers**: Serverless edge computing platform
- **Workers AI**: AI/ML model inference at the edge
- **Workflows**: Durable workflow execution for background tasks
- **D1 Database**: SQLite-compatible database for persistent storage
- **KV Storage**: Key-value store for caching and session management
- **R2 Storage**: Object storage for file management

### Frontend
- **Vanilla JavaScript**: Lightweight, framework-free implementation
- **HTML5/CSS3**: Modern web standards with responsive design
- **Supabase Auth**: Authentication and user management
- **Turnstile**: Bot protection and security

### Backend Services
- **ÉcoleDirecte API**: French school system integration
- **MEGA.nz API**: Cloud storage integration
- **Nodemailer**: Email notification service
- **Form-data**: Multipart form handling

### Development Tools
- **Wrangler**: Cloudflare Workers CLI for deployment and development
- **ES Modules**: Modern JavaScript module system
- **Node.js Compatibility**: Node.js runtime compatibility in Workers

---

## 📦 Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Wrangler CLI**: Latest version (`npm install -g wrangler`)

### Required Accounts
- **Cloudflare Account**: With Workers paid plan
- **Supabase Project**: For authentication and database
- **ÉcoleDirecte Account**: For school integration (optional)

### Environment Setup
```bash
# Install Node.js dependencies
npm install

# Login to Cloudflare
wrangler login

# Verify installation
wrangler --version
node --version
npm --version
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/lumaris.git
cd lumaris/client-worker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `wrangler.toml` file with your configuration:

```toml
name = "dashboard"
main = "src/index.js"
compatibility_date = "2026-05-22"
workers_dev = true
compatibility_flags = ["nodejs_compat"]

[vars]
MODE = "production"
SITE = "enabled"
JWT_SECRET = "your-secure-random-key"
JWT = "your-secure-random-key"

[env.production]
vars = { JWT_SECRET = "your-production-secret", JWT = "your-production-secret" }

# Add your bindings for D1, KV, R2, etc.
```

### 4. Set Up Databases

```bash
# Create D1 database
wrangler d1 create customization

# Create KV namespace
wrangler kv:namespace create "deleted_chats"

# Update wrangler.toml with the returned IDs
```

### 5. Run Migrations

```bash
# Apply database migrations
wrangler d1 execute customization --file=./migrations/schema.sql
```

### 6. Development Mode

```bash
# Start local development server
wrangler dev

# Deploy to Workers.dev
wrangler deploy
```

### 7. Production Deployment

```bash
# Deploy to production
wrangler deploy --env production
```

---

## 📁 Project Structure

```
client-worker/
├── src/
│   ├── index.js                 # Main entry point and API router
│   ├── frontend/                # Frontend assets and pages
│   │   ├── assets/            # Static assets (images, videos, icons)
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Shared JavaScript libraries
│   │   ├── pages/             # Application pages
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── home/         # Home dashboard
│   │   │   ├── settings/     # Settings pages
│   │   │   ├── workspace/    # Workspace management
│   │   │   ├── study-notes/  # Study notes functionality
│   │   │   ├── tools/        # Productivity tools
│   │   │   └── files/        # File management
│   │   └── styles/           # Global CSS styles
│   ├── backend/               # Backend services and API handlers
│   │   ├── auth/             # Authentication and authorization
│   │   ├── ai/               # AI-powered features
│   │   ├── cache/            # Caching layer
│   │   ├── database/         # Database operations
│   │   ├── ecole_directe/    # ÉcoleDirecte integration
│   │   ├── notifications/    # Notification services
│   │   ├── settings/         # Settings management
│   │   └── tools/            # Utility tools
│   └── workflows/            # Background workflows
│       └── check_grades.js   # Grade checking workflow
├── migrations/               # Database migration files
├── .github/                  # GitHub configuration
├── node_modules/            # Dependencies
├── package.json             # Project dependencies
├── wrangler.toml           # Cloudflare Workers configuration
├── README.md               # This file
├── LICENSE                 # License information
└── SECURITY.md             # Security policies
```

For detailed documentation on each directory, see the respective README files:
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/README.md" />
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/README.md" />
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/README.md" />

---

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user with Supabase and receive session token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "turnstileToken": "turnstile_response_token"
}
```

**Response:**
```json
{
  "valid": true,
  "token": "jwt_session_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/verify`
Verify JWT session token.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "valid": true,
  "payload": {
    "user_id": "user_id",
    "exp": 1234567890
  }
}
```

### Academic Endpoints

#### GET `/api/ed/grades`
Retrieve student grades from ÉcoleDirecte.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "grades": [
    {
      "subject": "Mathematics",
      "grade": 18.5,
      "coefficient": 2,
      "date": "2024-01-15"
    }
  ]
}
```

#### GET `/api/ed/homework`
Retrieve homework assignments.

**Response:**
```json
{
  "homework": [
    {
      "subject": "French",
      "task": "Read chapter 5",
      "due_date": "2024-01-20"
    }
  ]
}
```

### AI Endpoints

#### POST `/api/ai/chat`
Send message to AI assistant.

**Request Body:**
```json
{
  "message": "Explain quadratic equations",
  "context": "mathematics"
}
```

**Response:**
```json
{
  "response": "Quadratic equations are polynomial equations...",
  "usage": {
    "tokens": 150,
    "model": "meta-llama/llama-2-7b-chat-int8"
  }
}
```

### File Management Endpoints

#### POST `/api/files/upload`
Upload file to cloud storage.

**Request:** Multipart form data with file.

**Response:**
```json
{
  "success": true,
  "file_id": "file_id",
  "url": "https://storage.url/file"
}
```

### Settings Endpoints

#### GET `/api/settings/customization`
Get user customization settings.

**Response:**
```json
{
  "theme": "dark",
  "language": "fr",
  "notifications": true
}
```

#### PUT `/api/settings/customization`
Update user settings.

**Request Body:**
```json
{
  "theme": "light",
  "language": "en"
}
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | `your_secure_random_key` |
| `JWT` | Additional JWT verification key | `your_secure_random_key` |
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `your_anon_key` |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | `0x4AAAA...` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | `0x4AAAA...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MODE` | Application mode | `production` |
| `SITE` | Site status | `enabled` |

### Service Bindings

| Binding | Type | Description |
|---------|------|-------------|
| `ASSETS` | Assets | Static site assets |
| `AI` | AI Binding | Workers AI integration |
| `deleted_chats` | KV Namespace | Deleted conversation storage |
| `customization` | D1 Database | User settings database |
| `CHECK_GRADES` | Workflow | Grade checking workflow |

---

## 🌐 Deployment

### Cloudflare Workers Deployment

#### Development Deployment
```bash
# Deploy to workers.dev
wrangler deploy

# Deploy with specific environment
wrangler deploy --env staging
```

#### Production Deployment
```bash
# Deploy to production environment
wrangler deploy --env production

# Deploy with custom domain
wrangler deploy --env production
```

### Domain Configuration

1. **Add Custom Domain** in Cloudflare Dashboard:
   - Go to Workers & Pages
   - Select your worker
   - Add custom domain

2. **Configure DNS**:
   - Add CNAME record pointing to your worker
   - Wait for DNS propagation

3. **Update Environment**:
   - Update `wrangler.toml` with production settings
   - Set environment variables

### Database Deployment

```bash
# Create production database
wrangler d1 create customization --env production

# Run migrations
wrangler d1 execute customization --env production --file=./migrations/schema.sql
```

### Monitoring Setup

Enable observability in `wrangler.toml`:
```toml
[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
invocation_logs = true

[observability.traces]
enabled = true
head_sampling_rate = 1
```

---

## 💻 Development

### Local Development

```bash
# Start local development server
wrangler dev

# Start with specific port
wrangler dev --port 8787

# Start with remote debugging
wrangler dev --local
```

### Database Management

```bash
# Execute SQL query
wrangler d1 execute customization --command="SELECT * FROM users"

# Open interactive shell
wrangler d1 execute customization --remote

# Backup database
wrangler d1 export customization --remote --output=backup.sql
```

### KV Management

```bash
# Put value
wrangler kv:key put --binding=deleted_chats "key" "value"

# Get value
wrangler kv:key get --binding=deleted_chats "key"

# List keys
wrangler kv:key list --binding=deleted_chats
```

### Workflow Testing

```bash
# Trigger workflow manually
wrangler workflows trigger check_grades

# View workflow status
wrangler workflows status
```

### Code Style

Follow these conventions:
- Use ES Modules syntax
- Implement proper error handling
- Add JSDoc comments for functions
- Use async/await for asynchronous operations
- Follow Cloudflare Workers best practices

---

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**:
   - Test login with valid credentials
   - Verify JWT token generation
   - Test token validation

2. **API Endpoints**:
   - Test each endpoint with valid/invalid data
   - Verify error handling
   - Check CORS configuration

3. **Integration Testing**:
   - Test ÉcoleDirecte integration
   - Verify AI responses
   - Check file upload/download

### Automated Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 🔒 Security

### Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication
- **Supabase Integration**: Enterprise-grade user management
- **Turnstile Protection**: Bot prevention and security
- **Session Management**: Secure session handling with expiration

### Data Protection

- **Encryption**: All sensitive data encrypted at rest
- **Secure Headers**: Implementation of security headers
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization

### API Security

- **Rate Limiting**: Implementation of rate limiting
- **Request Validation**: Strict request validation
- **Error Handling**: Secure error messages without information leakage
- **Worker URL Blocking**: Prevention of workers.dev access in production

### Best Practices

- Never commit secrets to repository
- Use environment variables for sensitive data
- Implement proper logging and monitoring
- Regular security audits
- Keep dependencies updated

See <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/SECURITY.md" /> for detailed security policies.

---

## ⚡ Performance

### Optimization Strategies

- **Edge Computing**: Cloudflare Workers for global edge deployment
- **Caching**: KV storage for frequently accessed data
- **CDN Integration**: Static assets served through Cloudflare CDN
- **Database Optimization**: Indexed queries and efficient data structures

### Monitoring Metrics

- **Response Time**: Target < 200ms for API calls
- **Uptime**: 99.9% availability target
- **Error Rate**: < 0.1% error rate target
- **Memory Usage**: Optimize for Workers memory limits

### Performance Tips

1. **Cache Frequently Accessed Data**: Use KV for caching
2. **Optimize Database Queries**: Use proper indexing
3. **Minimize Bundle Size**: Optimize frontend assets
4. **Use Compression**: Enable compression for responses
5. **Monitor Performance**: Regular performance audits

---

## 📊 Monitoring

### Observability

Enable comprehensive monitoring through Cloudflare Observability:

```toml
[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
invocation_logs = true

[observability.traces]
enabled = true
head_sampling_rate = 1
```

### Logging

- **Structured Logging**: JSON-formatted logs
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time tracking
- **User Actions**: Audit logging for sensitive operations

### Alerts

Set up alerts for:
- High error rates
- Performance degradation
- Security incidents
- Failed workflow executions

---

## 🔧 Troubleshooting

### Common Issues

#### Deployment Failures

**Problem**: Deployment fails with authentication error
```bash
# Solution: Re-authenticate
wrangler login
```

#### Database Connection Issues

**Problem**: D1 database connection fails
```bash
# Solution: Check database ID in wrangler.toml
wrangler d1 list
```

#### Environment Variable Issues

**Problem**: Environment variables not loading
```bash
# Solution: Verify wrangler.toml configuration
wrangler secret list
```

#### CORS Errors

**Problem**: CORS errors in browser
```bash
# Solution: Check CORS headers in src/index.js
# Ensure proper origin configuration
```

### Debug Mode

Enable debug logging:
```bash
wrangler dev --log-level debug
```

### Getting Help

- Check Cloudflare Workers documentation
- Review GitHub issues
- Contact support team
- Join community Discord

---

## 🤝 Contributing

We welcome contributions to Lumaris! Please follow these guidelines:

### Contribution Guidelines

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation
4. **Commit Changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
5. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**
   - Describe your changes
   - Reference related issues
   - Ensure CI checks pass

### Code Review Process

- All submissions require review
- Maintain code quality standards
- Update relevant documentation
- Test thoroughly before submission

### Development Standards

- Follow existing code patterns
- Write clear, descriptive commit messages
- Add comments for complex logic
- Ensure backward compatibility

---

## 📄 License

This project is licensed under the MIT License - see the <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/LICENSE" /> file for details.

---

## 🆘 Support

### Documentation

- **Main Documentation**: This README file
- **API Documentation**: See API Documentation section
- **Module Documentation**: Check individual module README files

### Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Community discussions and questions
- **Email Support**: support@lumaris.education

### Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)
- [ÉcoleDirecte API Documentation](https://api.ecoledirecte.com/)

---

## 🎯 Roadmap

### Upcoming Features

- [ ] Mobile application (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Parent portal integration
- [ ] Multi-language support
- [ ] Offline mode support
- [ ] Enhanced AI capabilities
- [ ] Integration with additional school systems

### Planned Improvements

- [ ] Performance optimization
- [ ] Enhanced security features
- [ ] Improved accessibility
- [ ] Expanded customization options
- [ ] Real-time collaboration features

---

## 📞 Contact

- **Project Lead**: Your Name
- **Email**: contact@lumaris.education
- **Website**: https://lumaris.education
- **Twitter**: @LumarisApp

---

<p align="center">
  <strong>Built with ❤️ for students and educators</strong>
</p>

<p align="center">
  <a href="https://cloudflare.com">
    <img src="https://raw.githubusercontent.com/cloudflare/workers-sdk/master/logo.svg" alt="Cloudflare Workers" width="100"/>
  </a>
</p>
