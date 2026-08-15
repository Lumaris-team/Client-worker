# Backend Directory

This directory contains all server-side services, API handlers, business logic, and external integrations for the Lumaris platform. The backend is designed as a collection of modular services that handle specific domains of functionality.

## 📋 Table of Contents

- [Overview](#-overview)
- [Directory Structure](#-directory-structure)
- [Architecture](#-architecture)
- [Service Modules](#-service-modules)
- [API Endpoints](#-api-endpoints)
- [Database Integration](#-database-integration)
- [External Integrations](#-external-integrations)
- [Authentication & Authorization](#-authentication--authorization)
- [Error Handling](#-error-handling)
- [Development Guidelines](#-development-guidelines)
- [Testing](#-testing)

---

## 🎯 Overview

The backend is organized as a service-oriented architecture where each directory represents a specific domain or service. All services follow a consistent pattern of exporting a main function that handles API requests for that domain.

### Design Principles

- **Modular Architecture**: Each service is self-contained and independently testable
- **Consistent Interfaces**: Services export standardized function signatures
- **Error Resilience**: Comprehensive error handling and logging
- **Security First**: Input validation and secure data handling
- **Performance Optimized**: Efficient use of Cloudflare Workers resources

---

## 📁 Directory Structure

```
backend/
├── auth/                  # Authentication and authorization services
│   ├── index.js          # Main auth API handler
│   ├── supabase_jwt.js   # Supabase JWT verification
│   ├── session.js        # Session token management
│   ├── turnstile.js      # Turnstile CAPTCHA verification
│   └── encoding.js       # Encoding utilities
├── ai/                    # AI-powered features
│   ├── index.js          # Main AI API handler
│   ├── basic.js          # Basic AI chat functionality
│   ├── pictures.js       # Image generation and analysis
│   ├── reasonning.js     # Advanced reasoning models
│   ├── search_web.js     # Web search integration
│   ├── notes_remarks.js  # Note and remark analysis
│   ├── core.js           # Core AI utilities
│   ├── gateway_logs.js   # Conversation logging
│   ├── gateway_metadata.js # Gateway metadata management
│   └── limits.js         # AI usage limits and tracking
├── cache/                 # Caching layer
│   ├── index.js          # Main cache API handler
│   ├── get.js            # Cache retrieval
│   ├── set.js            # Cache storage
│   ├── delete.js         # Cache invalidation
│   └── calcul_history.js # Calculation history caching
├── database/              # Database operations
│   ├── pomodoro.js       # Pomodoro timer data
│   ├── websites.js       # Website blocking rules
│   ├── files_management.js # File management operations
│   ├── study_notes.js    # Study notes storage
│   ├── mega.js           # MEGA storage integration
│   ├── storage_stats.js  # Storage statistics
│   └── notes.js          # General note operations
├── ecole_directe/         # ÉcoleDirecte integration
│   ├── index.js          # Main ÉcoleDirecte API handler
│   ├── informations.js   # Student information
│   ├── grades.js         # Grade management
│   ├── homeworks.js      # Homework management
│   └── timetable.js      # Timetable access
├── notifications/         # Notification services
│   ├── index.js          # Main notifications API handler
│   ├── mail.js           # Email notifications
│   └── notifier.js       # Notification delivery system
├── settings/              # Settings management
│   ├── stats.js          # Usage statistics
│   └── customization.js # User customization settings
└── tools/                 # Utility tools
    ├── index.js          # Main tools API handler
    ├── converter.js      # Data conversion utilities
    └── calcul_history.js # Calculation history management
```

---

## 🏗️ Architecture

### Service Pattern

Each backend service follows a consistent pattern:

```javascript
// Service structure
export async function ServiceName(env, subpath, method, headers, body, request) {
  // Route handling based on subpath and method
  // Business logic
  // External API calls
  // Database operations
  // Response formatting
  return response;
}
```

### Request Flow

```
1. Client Request → Main index.js
2. Route Matching → Service Handler
3. Authentication → JWT Validation
4. Authorization → Permission Check
5. Business Logic → Service Processing
6. Data Access → Database/External API
7. Response → JSON Response
```

### Error Handling Strategy

All services implement consistent error handling:

```javascript
try {
  // Business logic
  return result;
} catch (error) {
  console.error("Service error:", error);
  return { error: error.message, status: 500 };
}
```

---

## 🔧 Service Modules

### Authentication Service (`auth/`)

**Purpose**: Handle user authentication and authorization

**Key Functions**:
- `Auth(env, path, method, body, request)`: Main auth handler
- `verifySupabaseToken(token, supabaseUrl)`: Verify Supabase JWT
- `issueSessionToken(env, payload)`: Generate session token
- `verifySessionToken(env, token)`: Validate session token
- `verifyTurnstileToken(env, token, remoteip)`: Verify Turnstile CAPTCHA

**API Endpoints**:
- `POST /api/auth/turnstile`: Verify Turnstile token
- `POST /api/auth/session`: Exchange Supabase token for session token
- `POST /api/auth/check`: Validate session token

**Dependencies**: Supabase, Cloudflare Turnstile

### AI Service (`ai/`)

**Purpose**: Provide AI-powered features using Cloudflare Workers AI

**Key Functions**:
- `AIfunction(env, subpath, method, headers, body, request)`: Main AI handler
- `basic(env, model, params)`: Basic AI chat
- `pictures(env, model, params)`: Image generation/analysis
- `reasonning(env, model, params)`: Advanced reasoning
- `search_web(env, model, params)`: Web search integration
- `notes_remarks(env, model, params)`: Note analysis

**API Endpoints**:
- `GET /api/ai/categories`: Get available AI models and categories
- `POST /api/ai/chat`: Unified AI chat interface
- `GET /api/ai/conversations`: List conversations
- `GET /api/ai/conversations/:id`: Get specific conversation
- `DELETE /api/ai/conversations/:id`: Delete conversation
- `GET /api/ai/limits`: Get AI usage limits

**Dependencies**: Cloudflare Workers AI, KV storage

**Model Categories**:
- `basic`: General purpose AI models
- `pictures`: Image generation and analysis
- `reasonning`: Advanced reasoning models
- `search_web`: Web search enabled models
- `notes_remarks`: Note and remark analysis

### Cache Service (`cache/`)

**Purpose**: Provide caching layer for performance optimization

**Key Functions**:
- `Cache(env, subpath, method, body)`: Main cache handler
- Cache operations using KV storage
- Calculation history caching

**API Endpoints**:
- `GET /api/cache/:key`: Retrieve cached value
- `POST /api/cache/:key`: Store value in cache
- `DELETE /api/cache/:key`: Remove from cache

**Dependencies**: Cloudflare KV

### Database Service (`database/`)

**Purpose**: Handle all database operations for persistent data storage

**Key Functions**:
- `Pomodoro(env, subpath, method, body)`: Pomodoro timer operations
- `WebsitesFunction(env, subpath, method, body)`: Website blocking rules
- `FilesFunction(env, subpath, method, body)`: File management
- `StudyNotesFunction(env, subpath, method, body)`: Study notes operations
- `initializeFolderArchitecture(env, userId)`: Initialize user folders

**API Endpoints**:
- `GET/POST /api/pomodoro/*`: Pomodoro timer management
- `GET/POST/DELETE /api/websites/*`: Website blocking rules
- `GET/POST /api/files/*`: File management operations
- `GET/POST /api/study-notes/*`: Study notes management

**Dependencies**: D1 database, MEGA API

### ÉcoleDirecte Service (`ecole_directe/`)

**Purpose**: Integrate with French school system (ÉcoleDirecte)

**Key Functions**:
- `EDfunction(env, subpath, method, headers, body)`: Main ÉcoleDirecte handler
- `EDinformations(env, newToken)`: Get student information
- `EDgrades(env, informations, filter)`: Get student grades
- `EDaverages(gradesData)`: Calculate grade averages
- `EDhomeworks(env, informations, filter)`: Get homework assignments
- `EDtimetable(env, informations, filter)`: Get student timetable

**API Endpoints**:
- `GET /api/ed/info`: Get student information
- `GET /api/ed/grades`: Get student grades
- `GET /api/ed/averages`: Get grade averages
- `GET /api/ed/new-grades`: Get new grades since last check
- `GET /api/ed/homeworks`: Get homework assignments
- `POST /api/ed/homeworks`: Mark homework as done
- `GET /api/ed/timetable`: Get student timetable

**Dependencies**: ÉcoleDirecte API

### Notifications Service (`notifications/`)

**Purpose**: Handle user notifications and alerts

**Key Functions**:
- `sendMail(env, mailOptions)`: Send email notifications
- Notification delivery system

**API Endpoints**: Integrated into other services

**Dependencies**: Nodemailer, SMTP service

### Settings Service (`settings/`)

**Purpose**: Manage user settings and application statistics

**Key Functions**:
- `StatsFunction(env)`: Get usage statistics
- `CustomizationFunction(env, subpath, method, body, session)`: User customization

**API Endpoints**:
- `GET /api/settings/stats`: Get usage statistics
- `GET/PUT /api/settings/customization`: User customization settings

**Dependencies**: D1 database

### Tools Service (`tools/`)

**Purpose**: Provide utility tools and converters

**Key Functions**:
- `ToolsFunction(env, subpath, method, body)`: Main tools handler
- Data conversion utilities
- Calculation history management

**API Endpoints**:
- `POST /api/tools/*`: Various tool operations

**Dependencies**: None (internal utilities)

---

## 🔌 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/turnstile`
Verify Turnstile CAPTCHA token

**Request Body**:
```json
{
  "token": "turnstile_token"
}
```

**Response**:
```json
{
  "success": true,
  "reason": "valid"
}
```

#### POST `/api/auth/session`
Exchange Supabase token for session token

**Request Body**:
```json
{
  "access_token": "supabase_access_token"
}
```

**Response**:
```json
{
  "valid": true,
  "token": "session_token",
  "exp": 1234567890,
  "expiresIn": 3600
}
```

### AI Endpoints

#### GET `/api/ai/categories`
Get available AI models and categories

**Response**:
```json
{
  "categories": ["basic", "pictures", "reasonning", "search_web"],
  "availableModels": [
    {
      "model": "@cf/meta/llama-2-7b-chat-int8",
      "name": "Llama 2 7B Chat",
      "description": "General purpose chat model",
      "type": "text-generation",
      "consumption": 5,
      "categories": ["basic", "search_web"]
    }
  ],
  "categorizedModels": {
    "basic": [...],
    "pictures": [...],
    "reasonning": [...],
    "search_web": [...]
  }
}
```

#### POST `/api/ai/chat`
Unified AI chat interface

**Request Body**:
```json
{
  "category": "basic",
  "model": "@cf/meta/llama-2-7b-chat-int8",
  "prompt": "Explain quantum computing",
  "conversationId": "optional_conversation_id",
  "conversationName": "Optional conversation name"
}
```

**Response**:
```json
{
  "response": "AI response text",
  "conversationId": "conversation_id",
  "conversationName": "conversation_name",
  "usage": {
    "tokens": 150,
    "model": "model_name"
  }
}
```

### ÉcoleDirecte Endpoints

#### GET `/api/ed/info`
Get student information

**Headers**:
```
filter: true/false
new_token: true/false
```

**Response**:
```json
{
  "student": {
    "id": "student_id",
    "name": "Student Name",
    "class": "Class Name",
    "school": "School Name"
  }
}
```

#### GET `/api/ed/grades`
Get student grades

**Headers**:
```
filter: true/false
```

**Response**:
```json
{
  "grades": [
    {
      "subject": "Mathematics",
      "grade": 18.5,
      "coefficient": 2,
      "date": "2024-01-15",
      "teacher": "Teacher Name"
    }
  ]
}
```

### Database Endpoints

#### GET `/api/pomodoro/sessions`
Get Pomodoro sessions

**Response**:
```json
{
  "sessions": [
    {
      "id": 1,
      "duration": 25,
      "subject": "Mathematics",
      "completed": true,
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST `/api/files/upload`
Upload file to cloud storage

**Request**: Multipart form data with file

**Response**:
```json
{
  "success": true,
  "file_id": "file_id",
  "url": "https://storage.url/file"
}
```

---

## 💾 Database Integration

### D1 Database Usage

The backend uses Cloudflare D1 for persistent storage:

**Database Schema**:
- Users table: User account information
- Settings table: User customization settings
- Pomodoro table: Pomodoro timer sessions
- Websites table: Website blocking rules
- Study notes table: Study notes and content
- Files table: File metadata and organization

**Connection**:
```javascript
// Database access through env binding
const result = await env.customization.prepare("SELECT * FROM users WHERE id = ?").bind(userId).all();
```

### KV Storage Usage

Cloudflare KV is used for caching and session management:

**Use Cases**:
- Deleted conversation tracking
- Cache for frequently accessed data
- Session token validation
- Calculation history

**Operations**:
```javascript
// Get value
const value = await env.deleted_chats.get(key);

// Set value
await env.deleted_chats.put(key, value, { expirationTtl: 3600 });

// Delete value
await env.deleted_chats.delete(key);
```

---

## 🔗 External Integrations

### Supabase Integration

**Purpose**: Authentication and user management

**Usage**:
- JWT token verification
- User authentication
- Session management

**Configuration**:
```toml
[vars]
SUPABASE_URL = "https://xyz.supabase.co"
SUPABASE_ANON_KEY = "your_anon_key"
```

### Cloudflare Workers AI

**Purpose**: AI model inference

**Usage**:
- Text generation
- Image generation
- Web search
- Advanced reasoning

**Configuration**:
```toml
[ai]
name = "AI"
binding = "AI"

[vars]
CLOUDFLARE_ACCOUNT_ID = "your_account_id"
```

### ÉcoleDirecte API

**Purpose**: French school system integration

**Usage**:
- Grade retrieval
- Homework management
- Timetable access
- Student information

**Authentication**: Token-based authentication with ÉcoleDirecte

### MEGA.nz API

**Purpose**: Cloud storage integration

**Usage**:
- File upload/download
- Folder management
- Storage organization

**Dependencies**: megajs library

### Email Service

**Purpose**: Notification delivery

**Usage**:
- Error notifications
- User alerts
- System notifications

**Dependencies**: Nodemailer, SMTP service

---

## 🔐 Authentication & Authorization

### JWT Token Management

**Session Token Flow**:
1. User authenticates with Supabase
2. Frontend receives Supabase access token
3. Frontend exchanges for server session token
4. Session token used for API requests
5. Session token validated on each request

**Token Structure**:
```javascript
{
  user_id: "user_id",
  exp: expiration_timestamp,
  iat: issued_at_timestamp
}
```

### Authorization Middleware

All protected routes require valid JWT:

```javascript
const authHeader = headers.get("Authorization") || "";
const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
const session = await verifySessionToken(env, bearer);
if (!session.valid) {
  return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
}
```

### Turnstile Integration

Bot protection using Cloudflare Turnstile:

```javascript
const result = await verifyTurnstileToken(env, token, remoteip);
if (!result.success) {
  return { error: "invalid_captcha" };
}
```

---

## ⚠️ Error Handling

### Standard Error Response

All services return consistent error responses:

```json
{
  "error": "error_message",
  "status": 500,
  "details": "additional_error_details"
}
```

### Error Categories

- **Authentication Errors**: Invalid tokens, expired sessions
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid input data
- **External API Errors**: Third-party service failures
- **Database Errors**: Query failures, connection issues

### Logging Strategy

Comprehensive logging for debugging and monitoring:

```javascript
console.error("Service error:", error);
console.log("Request info:", { method, path, body });
```

---

## 🛠️ Development Guidelines

### Service Creation Pattern

When creating a new service:

1. **Create directory**: `backend/new_service/`
2. **Implement handler**: `index.js` with main function
3. **Add routing**: Update main `index.js` to include new service
4. **Add documentation**: Document API endpoints
5. **Add tests**: Create test cases
6. **Update main README**: Document the new service

### Code Standards

- **Function Naming**: Use descriptive names (e.g., `getUserData`)
- **Error Handling**: Always include try-catch blocks
- **Input Validation**: Validate all input parameters
- **Response Format**: Consistent JSON responses
- **Logging**: Include context in log messages

### Security Best Practices

- **Input Validation**: Validate and sanitize all inputs
- **SQL Injection**: Use parameterized queries
- **Secrets Management**: Never hardcode secrets
- **Rate Limiting**: Implement rate limiting for API endpoints
- **CORS**: Configure CORS properly

---

## 🧪 Testing

### Unit Testing

Test individual service functions:

```javascript
// Test authentication
test("verifySessionToken validates valid token", async () => {
  const result = await verifySessionToken(env, validToken);
  expect(result.valid).toBe(true);
});
```

### Integration Testing

Test service interactions:

```javascript
// Test AI service with database
test("AI chat stores conversation in database", async () => {
  const response = await AIfunction(env, "chat", "POST", headers, body);
  expect(response.conversationId).toBeDefined();
});
```

### API Testing

Test complete API flows:

```bash
# Test authentication
curl -X POST https://api.example.com/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"access_token": "token"}'

# Test AI chat
curl -X POST https://api.example.com/api/ai/chat \
  -H "Authorization: Bearer session_token" \
  -H "Content-Type: application/json" \
  -d '{"category": "basic", "prompt": "Hello"}'
```

---

## 📚 Additional Documentation

For detailed information about specific services, see:

- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/auth/README.md" /> - Authentication service
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/ai/README.md" /> - AI service
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/ecole_directe/README.md" /> - ÉcoleDirecte integration
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/database/README.md" /> - Database operations

---

## 🚀 Deployment

Backend services are deployed as part of the Cloudflare Worker:

```bash
# Deploy to development
wrangler dev

# Deploy to production
wrangler deploy --env production
```

All backend code is bundled and optimized automatically during deployment.

---

## 📝 Notes

- All services are designed for edge deployment
- Database connections use Cloudflare D1 binding
- External API calls should include proper error handling
- Rate limiting should be implemented for external APIs
- Cache frequently accessed data using KV storage

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>