# Database Operations

This directory contains all database operations for the Lumaris platform, using Cloudflare D1 (SQLite-compatible) for persistent data storage and MEGA.nz for cloud storage integration.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Cloud Storage Integration](#-cloud-storage-integration)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The database operations layer provides a unified interface for all data persistence needs in the Lumaris platform:

- **D1 Database**: SQLite-compatible database for structured data
- **MEGA Integration**: Cloud storage for file management
- **Data Models**: Consistent data structures across the platform
- **Query Optimization**: Efficient database operations
- **Transaction Management**: Reliable data operations

### Database Technologies

- **Cloudflare D1**: Edge SQL database with SQLite compatibility
- **MEGA.nz API**: Cloud storage for file management
- **Schema Management**: Version-controlled database migrations
- **Query Builder**: Type-safe query construction

---

## 🏗️ Architecture

### Database Architecture

```
Database Layer
├── D1 Database (SQLite-compatible)
│   ├── Users table
│   ├── Settings table
│   ├── Pomodoro sessions table
│   ├── Websites table
│   ├── Study notes table
│   └── Files metadata table
├── MEGA Cloud Storage
│   ├── File upload/download
│   ├── Folder management
│   ├── Storage statistics
│   └── File sharing
└── Cache Layer
    ├── Query result caching
    ├── Session data
    └── Temporary storage
```

### Data Flow

```
1. API Request → Database Handler
2. Query Construction → Build SQL query
3. Database Execution → Execute query on D1
4. Result Processing → Parse and format results
5. Cache Update → Update cache if needed
6. Response Delivery → Return formatted data
```

---

## 📦 Available Modules

### Pomodoro Timer (`pomodoro.js`)

**Purpose**: Manage Pomodoro timer sessions and statistics

**Key Function**:
```javascript
export async function Pomodoro(env, subpath, method, body)
```

**Features**:
- Session creation and tracking
- Duration customization
- Subject association
- Completion statistics
- User analytics

**API Endpoints**:
- `GET /api/pomodoro/sessions`: Get user sessions
- `POST /api/pomodoro/sessions`: Create new session
- `PUT /api/pomodoro/sessions/:id`: Update session
- `DELETE /api/pomodoro/sessions/:id`: Delete session

**Data Model**:
```javascript
{
  id: Number,
  user_id: String,
  duration: Number,        // Duration in minutes
  subject: String,         // Subject studied
  completed: Boolean,     // Completion status
  timestamp: String,      // ISO timestamp
  break_duration: Number   // Break duration
}
```

### Website Management (`websites.js`)

**Purpose**: Manage website blocking rules and productivity

**Key Function**:
```javascript
export async function WebsitesFunction(env, subpath, method, body)
```

**Features**:
- Website blocking rules
- Time-based restrictions
- Category management
- Whitelist/blacklist
- Usage statistics

**API Endpoints**:
- `GET /api/websites`: Get blocking rules
- `POST /api/websites`: Create blocking rule
- `PUT /api/websites/:id`: Update rule
- `DELETE /api/websites/:id`: Delete rule

**Data Model**:
```javascript
{
  id: Number,
  user_id: String,
  domain: String,          // Website domain
  category: String,       // Website category
  schedule: String,       // Time schedule JSON
  enabled: Boolean,       // Rule status
  created_at: String      // Creation timestamp
}
```

### File Management (`files_management.js`)

**Purpose**: Comprehensive file management with MEGA integration

**Key Function**:
```javascript
export async function FilesFunction(env, subpath, method, body)
export async function initializeFolderArchitecture(env, userId)
```

**Features**:
- File upload/download
- Folder organization
- File metadata management
- Storage statistics
- User folder initialization

**API Endpoints**:
- `GET /api/files/*`: Get files/folders
- `POST /api/files/upload`: Upload file
- `DELETE /api/files/*`: Delete file/folder
- `PUT /api/files/*`: Update file metadata

**Data Model**:
```javascript
{
  id: Number,
  user_id: String,
  name: String,           // File name
  type: String,           // File type (file/folder)
  size: Number,           // File size in bytes
  mime_type: String,      // MIME type
  mega_id: String,        // MEGA file ID
  parent_id: Number,      // Parent folder ID
  path: String,           // File path
  created_at: String,     // Creation timestamp
  updated_at: String      // Update timestamp
}
```

### Study Notes (`study_notes.js`)

**Purpose**: Academic note management and organization

**Key Function**:
```javascript
export async function StudyNotesFunction(env, subpath, method, body)
```

**Features**:
- Rich text note creation
- Subject organization
- Search functionality
- Export options
- Collaboration features

**API Endpoints**:
- `GET /api/study-notes/*`: Get notes
- `POST /api/study-notes`: Create note
- `PUT /api/study-notes/:id`: Update note
- `DELETE /api/study-notes/:id`: Delete note

**Data Model**:
```javascript
{
  id: Number,
  user_id: String,
  title: String,          // Note title
  content: String,        // Note content (rich text)
  subject: String,        // Subject
  tags: Array,            // Tags array
  created_at: String,     // Creation timestamp
  updated_at: String,     // Update timestamp
  is_favorite: Boolean    // Favorite status
}
```

### MEGA Integration (`mega.js`)

**Purpose**: MEGA.nz cloud storage integration

**Key Functions**:
```javascript
export async function uploadToMEGA(env, file, userId)
export async function downloadFromMEGA(env, megaId)
export async function deleteFromMEGA(env, megaId)
export async function getMEGAStorageStats(env, userId)
```

**Features**:
- File upload/download
- Folder management
- Storage statistics
- Error handling
- Retry logic

**MEGA Integration**:
- Uses megajs library for MEGA API
- Handles authentication automatically
- Manages file/folder operations
- Tracks storage usage

### Storage Statistics (`storage_stats.js`)

**Purpose**: Track and report storage usage statistics

**Key Function**:
```javascript
export async function getStorageStats(env, userId)
```

**Features**:
- Storage usage tracking
- File count statistics
- Storage limit monitoring
- Usage breakdown by type

**Response Structure**:
```javascript
{
  total_used: Number,     // Total bytes used
  total_limit: Number,    // Storage limit in bytes
  file_count: Number,     // Total file count
  folder_count: Number,   // Total folder count
  breakdown: {
    documents: Number,
    images: Number,
    videos: Number,
    other: Number
  }
}
```

### General Notes (`notes.js`)

**Purpose**: General note-taking functionality

**Features**:
- Simple note creation
- Quick notes
- Temporary notes
- Note cleanup

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Settings Table

```sql
CREATE TABLE settings (
  user_id TEXT PRIMARY KEY,
  background_type TEXT DEFAULT 'gradient',
  gradient_style TEXT DEFAULT 'linear',
  gradient_orientation TEXT DEFAULT '135deg',
  color1 TEXT DEFAULT '#0b3f91',
  color2 TEXT DEFAULT '#1c8cff',
  solid_color TEXT DEFAULT '#08100f',
  font_family TEXT DEFAULT 'Inter, ui-sans-serif, system-ui, sans-serif',
  font_weight TEXT DEFAULT '500',
  font_size INTEGER DEFAULT 16,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Pomodoro Sessions Table

```sql
CREATE TABLE pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  duration INTEGER NOT NULL,
  subject TEXT,
  completed BOOLEAN DEFAULT FALSE,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  break_duration INTEGER DEFAULT 5,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Websites Table

```sql
CREATE TABLE websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT,
  schedule TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Study Notes Table

```sql
CREATE TABLE study_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  subject TEXT,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_favorite BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Files Table

```sql
CREATE TABLE files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'file',
  size INTEGER DEFAULT 0,
  mime_type TEXT,
  mega_id TEXT,
  parent_id INTEGER,
  path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES files(id)
);
```

---

## 🔌 API Endpoints

### Pomodoro Endpoints

#### GET `/api/pomodoro/sessions`

Get user's Pomodoro sessions.

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

#### POST `/api/pomodoro/sessions`

Create new Pomodoro session.

**Request Body**:
```json
{
  "duration": 25,
  "subject": "Mathematics"
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "id": 2,
    "duration": 25,
    "subject": "Mathematics",
    "completed": false,
    "timestamp": "2024-01-15T11:00:00Z"
  }
}
```

### Website Endpoints

#### GET `/api/websites`

Get website blocking rules.

**Response**:
```json
{
  "rules": [
    {
      "id": 1,
      "domain": "facebook.com",
      "category": "social",
      "enabled": true,
      "schedule": "{\"hours\": [9,10,11,12,13,14,15,16,17]}"
    }
  ]
}
```

#### POST `/api/websites`

Create new blocking rule.

**Request Body**:
```json
{
  "domain": "twitter.com",
  "category": "social",
  "schedule": "{\"hours\": [9,10,11,12,13,14,15,16,17]}"
}
```

### File Endpoints

#### GET `/api/files`

Get user's files and folders.

**Query Parameters**:
- `folder_id`: Filter by parent folder
- `type`: Filter by type (file/folder)

**Response**:
```json
{
  "files": [
    {
      "id": 1,
      "name": "document.pdf",
      "type": "file",
      "size": 1024000,
      "mime_type": "application/pdf",
      "parent_id": null,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST `/api/files/upload`

Upload file to cloud storage.

**Request**: Multipart form data with file

**Response**:
```json
{
  "success": true,
  "file": {
    "id": 2,
    "name": "uploaded_file.jpg",
    "size": 2048000,
    "mega_id": "mega_file_id"
  }
}
```

### Study Notes Endpoints

#### GET `/api/study-notes`

Get user's study notes.

**Query Parameters**:
- `subject`: Filter by subject
- `search`: Search in title and content

**Response**:
```json
{
  "notes": [
    {
      "id": 1,
      "title": "Mathematics Chapter 1",
      "content": "Note content...",
      "subject": "Mathematics",
      "tags": ["algebra", "equations"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST `/api/study-notes`

Create new study note.

**Request Body**:
```json
{
  "title": "Physics Notes",
  "content": "Note content...",
  "subject": "Physics",
  "tags": ["mechanics", "forces"]
}
```

---

## ☁️ Cloud Storage Integration

### MEGA.nz Integration

The platform uses MEGA.nz for cloud file storage:

**Authentication**:
- MEGA credentials stored securely
- Automatic token management
- Session persistence

**File Operations**:
```javascript
// Upload file
const megaId = await uploadToMEGA(env, file, userId);

// Download file
const fileData = await downloadFromMEGA(env, megaId);

// Delete file
await deleteFromMEGA(env, megaId);

// Get storage stats
const stats = await getMEGAStorageStats(env, userId);
```

**Folder Architecture**:
```
User Root Folder
├── Documents/
├── Images/
├── Videos/
├── Study Materials/
├── Homework/
└── Other/
```

**Error Handling**:
- Automatic retry on failure
- Graceful degradation
- Detailed error logging
- User-friendly error messages

### Storage Management

**Initialization**:
```javascript
await initializeFolderArchitecture(env, userId);
```

This creates the standard folder structure for new users.

**Statistics Tracking**:
```javascript
const stats = await getStorageStats(env, userId);
console.log(`Storage used: ${stats.total_used}/${stats.total_limit} bytes`);
```

---

## 🛠️ Development Guidelines

### Database Operations

**Query Best Practices**:
```javascript
// Use parameterized queries
const result = await env.customization
  .prepare("SELECT * FROM users WHERE id = ?")
  .bind(userId)
  .all();

// Handle errors gracefully
try {
  const result = await env.customization
    .prepare("INSERT INTO users (id, email) VALUES (?, ?)")
    .bind(userId, email)
    .run();
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to create user');
}
```

**Transaction Management**:
```javascript
// For complex operations, use transactions
try {
  await env.customization.batch([
    env.customization.prepare("INSERT INTO files (...) VALUES (...)").bind(...),
    env.customization.prepare("UPDATE storage_stats SET ...").bind(...)
  ]);
} catch (error) {
  console.error('Transaction failed:', error);
  throw error;
}
```

### Schema Migrations

**Migration Process**:
1. Create migration file in `migrations/` directory
2. Test migration locally
3. Deploy to staging
4. Run migration on production
5. Verify migration success

**Migration Example**:
```sql
-- migrations/001_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences TEXT;
CREATE INDEX idx_users_email ON users(email);
```

### Error Handling

**Database Errors**:
```javascript
try {
  const result = await databaseOperation();
  return { success: true, data: result };
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    return { error: 'duplicate_entry' };
  } else if (error.message.includes('FOREIGN KEY')) {
    return { error: 'invalid_reference' };
  }
  return { error: 'database_error' };
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**:
- Check D1 binding configuration
- Verify database ID in wrangler.toml
- Check network connectivity
- Review Cloudflare dashboard

**Query Performance**:
- Add appropriate indexes
- Optimize query structure
- Use EXPLAIN QUERY PLAN
- Implement query caching

**MEGA Integration Issues**:
- Verify MEGA credentials
- Check API rate limits
- Review file size limits
- Check network connectivity

### Debugging

**Enable Query Logging**:
```javascript
console.log("Executing query:", query);
console.log("Query result:", result);
console.log("Execution time:", duration);
```

**Monitor Database Performance**:
```javascript
const startTime = Date.now();
const result = await env.customization.prepare(query).bind(...).all();
const duration = Date.now() - startTime;

if (duration > 1000) {
  console.warn(`Slow query (${duration}ms):`, query);
}
```

---

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [MEGA.nz API Documentation](https://mega.nz/api)
- [Database Best Practices](https://www.sqlite.org/optoverview.html)

---

## 🚀 Future Enhancements

Planned database improvements:

- **Query Optimization**: Advanced query optimization
- **Data Archiving**: Automatic data archiving
- **Backup System**: Automated backup and recovery
- **Analytics**: Advanced analytics and reporting
- **Multi-tenancy**: Enhanced multi-tenancy support
- **Replication**: Data replication for high availability

---

## 📝 Notes

- D1 provides SQLite-compatible database at the edge
- MEGA integration provides cloud storage for files
- All database operations use parameterized queries
- Schema is managed through migrations
- Error handling ensures data integrity
- Performance optimization is ongoing

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>