# Source Code Directory

This directory contains the complete source code for the Lumaris platform, organized into frontend assets, backend services, and workflow definitions.

## 📋 Table of Contents

- [Overview](#-overview)
- [Directory Structure](#-directory-structure)
- [Architecture](#-architecture)
- [Key Components](#-key-components)
- [Data Flow](#-data-flow)
- [Module Dependencies](#-module-dependencies)
- [Development Guidelines](#-development-guidelines)
- [Testing](#-testing)

---

## 🎯 Overview

The `src/` directory is organized into three main areas:

1. **`frontend/`**: Client-side assets, pages, and user interface components
2. **`backend/`**: Server-side API handlers, business logic, and integrations
3. **`workflows/`**: Background workflow definitions for scheduled tasks

All source code uses ES Modules and follows Cloudflare Workers conventions for edge deployment.

---

## 📁 Directory Structure

```
src/
├── index.js                 # Main entry point - API router and request handler
├── frontend/               # Frontend assets and pages
│   ├── assets/            # Static assets (images, videos, icons)
│   ├── components/        # Reusable UI components
│   ├── lib/               # Shared JavaScript libraries
│   ├── pages/             # Application pages
│   └── styles/           # Global CSS styles
├── backend/               # Backend services and API handlers
│   ├── auth/             # Authentication and authorization
│   ├── ai/               # AI-powered features
│   ├── cache/            # Caching layer
│   ├── database/         # Database operations
│   ├── ecole_directe/    # ÉcoleDirecte integration
│   ├── notifications/    # Notification services
│   ├── settings/         # Settings management
│   └── tools/            # Utility tools
└── workflows/            # Background workflows
    └── check_grades.js   # Grade checking workflow
```

---

## 🏗️ Architecture

### Entry Point (`index.js`)

The main entry point handles:

- **Request Routing**: Routes incoming requests to appropriate handlers
- **Authentication**: Validates JWT tokens for protected routes
- **CORS Management**: Handles cross-origin requests
- **Asset Serving**: Serves static frontend assets
- **Workflow Triggering**: Manages scheduled workflow execution

### Frontend Architecture

The frontend is organized as a multi-page application with:

- **Component-Based Design**: Reusable UI components in `components/`
- **Page-Specific Logic**: Each page has its own HTML, CSS, and JavaScript
- **Shared Libraries**: Common functionality in `lib/`
- **Asset Management**: Organized static assets in `assets/`

### Backend Architecture

The backend follows a service-oriented architecture:

- **Modular Services**: Each backend directory represents a service
- **API Handlers**: Each service exports a function for API handling
- **Database Abstraction**: Centralized database operations
- **External Integrations**: Dedicated modules for external APIs

---

## 🔑 Key Components

### Main Entry Point (`index.js`)

**Responsibilities:**
- Route incoming HTTP requests
- Authenticate and authorize requests
- Serve static assets
- Trigger scheduled workflows
- Handle errors and logging

**Key Functions:**
- `fetch(request, env, ctx)`: Main request handler
- `scheduled(event, env, ctx)`: Scheduled event handler

### Frontend Components

**Pages:**
- `auth/`: Authentication and login pages
- `home/`: Main dashboard and landing page
- `settings/`: User settings and customization
- `workspace/`: Workspace management interface
- `study-notes/`: Study notes functionality
- `tools/`: Productivity tools interface
- `files/`: File management interface
- `ai/`: AI chat interface
- `websites/`: Website management interface

**Shared Libraries:**
- `auth.js`: Authentication utilities
- `supabase.js`: Supabase client configuration
- `turnstile.js`: Turnstile CAPTCHA integration
- `settings.js`: Settings management
- `icons.js`: Icon system

### Backend Services

**Authentication (`auth/`):**
- JWT token generation and validation
- Supabase integration
- Turnstile verification
- Session management

**AI Services (`ai/`):**
- Workers AI integration
- Web search capabilities
- Image analysis
- Conversation management
- Usage tracking and limits

**School Integration (`ecole_directe/`):**
- Grade retrieval
- Homework management
- Timetable access
- Student information

**Database Operations (`database/`):**
- D1 database queries
- File management (MEGA integration)
- Study notes storage
- Pomodoro timer data
- Website blocking rules

**Caching Layer (`cache/`):**
- KV storage operations
- Cache invalidation
- Performance optimization

**Settings Management (`settings/`):**
- User customization
- Statistics tracking
- Preference storage

**Notifications (`notifications/`):**
- Email notifications
- Alert management
- Notification templates

**Tools (`tools/`):**
- Utility functions
- Data converters
- Calculation history

---

## 🔄 Data Flow

### Request Flow

```
1. User Request → index.js
2. Route Matching → Service Handler
3. Authentication → JWT Validation
4. Business Logic → Service Processing
5. External API → Third-party Integration
6. Database → Data Persistence
7. Response → JSON Response
```

### Authentication Flow

```
1. User Login → /api/auth/login
2. Supabase Auth → User Verification
3. Turnstile → Bot Protection
4. JWT Generation → Session Token
5. Token Storage → Client Side
6. Subsequent Requests → Token Validation
```

### AI Processing Flow

```
1. User Query → /api/ai/chat
2. Context Retrieval → Conversation History
3. AI Processing → Workers AI
4. Response Generation → AI Model
5. Caching → KV Storage
6. Usage Tracking → Statistics
7. Response Delivery → Client
```

---

## 🔗 Module Dependencies

### Core Dependencies

```javascript
// Main entry point imports
import { CheckGradesWorkflow } from "./workflows/check_grades";
import { EDfunction } from "./backend/ecole_directe/index.js";
import { AIfunction } from "./backend/ai/index.js";
import { Cache } from "./backend/cache/index.js";
import { Auth, verifySessionToken } from "./backend/auth/index.js";
```

### Frontend Dependencies

Frontend pages depend on shared libraries:
- `auth.js`: Authentication functions
- `supabase.js`: Database client
- `settings.js`: User preferences
- `icons.js`: UI icons

### Backend Service Dependencies

Backend services have these dependencies:
- **Auth**: Supabase, Turnstile, JWT libraries
- **AI**: Workers AI binding, KV storage
- **Database**: D1 binding, MEGA API
- **ÉcoleDirecte**: External API client
- **Notifications**: Nodemailer, SMTP

---

## 🛠️ Development Guidelines

### Code Organization

1. **Modular Design**: Each service should be self-contained
2. **Clear Interfaces**: Services should export clear function signatures
3. **Error Handling**: Comprehensive error handling at all levels
4. **Logging**: Structured logging for debugging and monitoring

### Naming Conventions

- **Files**: kebab-case for files (e.g., `study_notes.js`)
- **Functions**: camelCase for functions (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE for constants (e.g., `API_BASE_URL`)
- **Components**: PascalCase for components (if using framework)

### Code Style

- Use ES Modules syntax
- Implement async/await for asynchronous operations
- Add JSDoc comments for public functions
- Follow JavaScript best practices
- Maintain consistent indentation (2 spaces)

### Security Best Practices

- Never expose secrets in code
- Validate all input data
- Use parameterized queries for database operations
- Implement proper error handling without information leakage
- Follow principle of least privilege

---

## 🧪 Testing

### Unit Testing

Test individual modules and functions:

```bash
# Test authentication module
npm test -- auth

# Test AI services
npm test -- ai
```

### Integration Testing

Test service interactions:

```bash
# Test API endpoints
npm test -- integration

# Test database operations
npm test -- database
```

### End-to-End Testing

Test complete user flows:

```bash
# Test authentication flow
npm test -- e2e:auth

# Test AI interaction
npm test -- e2e:ai
```

---

## 📚 Additional Documentation

For detailed information about specific modules, see:

- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/README.md" /> - Frontend documentation
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/backend/README.md" /> - Backend documentation
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/workflows/README.md" /> - Workflows documentation

---

## 🚀 Deployment

The source code is deployed as a Cloudflare Worker:

```bash
# Deploy to development
wrangler dev

# Deploy to production
wrangler deploy --env production
```

All source code is bundled and optimized automatically during deployment.

---

## 📝 Notes

- The entire codebase uses ES Modules for modern JavaScript support
- Cloudflare Workers compatibility is maintained through `wrangler.toml` configuration
- Static assets are served through the Assets binding for optimal performance
- Background tasks are handled through the Workflows system
- All services are designed for edge deployment with minimal cold starts

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>