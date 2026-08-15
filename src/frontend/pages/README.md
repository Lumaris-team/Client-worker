# Frontend Pages Directory

This directory contains all the individual pages that make up the Lumaris platform's user interface. Each page is a self-contained module with its own HTML, CSS, and JavaScript files.

## 📋 Table of Contents

- [Overview](#-overview)
- [Page Structure](#-page-structure)
- [Available Pages](#-available-pages)
- [Page Routing](#-page-routing)
- [Shared Components](#-shared-components)
- [Development Guidelines](#-development-guidelines)
- [Responsive Design](#-responsive-design)
- [Accessibility](#accessibility)

---

## 🎯 Overview

The pages directory follows a multi-page application (MPA) architecture where each page is independently loadable and self-contained. This approach provides:

- **Fast Initial Load**: Only load the required page
- **Simple Caching**: Each page can be cached independently
- **Easy Maintenance**: Clear separation of concerns
- **Progressive Enhancement**: Core functionality without JavaScript

### Page Architecture Pattern

Each page follows a consistent structure:

```
pages/[page-name]/
├── index.html          # HTML structure and content
├── script.js          # Page-specific JavaScript logic
├── style.css          # Page-specific styling
└── icons.js          # Page-specific icons (optional)
```

---

## 📄 Page Structure

### Standard Page Components

Every page includes:

**HTML (`index.html`)**:
- Semantic HTML5 structure
- Meta tags for SEO and social sharing
- Structured content hierarchy
- ARIA labels for accessibility
- Responsive viewport meta tag

**JavaScript (`script.js`)**:
- Page initialization logic
- Event handlers
- API calls to backend
- Dynamic content rendering
- Error handling

**CSS (`style.css`)**:
- Page-specific styling
- Responsive breakpoints
- Theme support (dark/light)
- Animation definitions
- Print styles (if applicable)

**Icons (`icons.js`)**:
- Icon definitions for the page
- SVG icon components
- Icon caching system
- Custom icon support

---

## 📱 Available Pages

### Authentication Pages (`auth/`)

**Purpose**: User authentication and account management

**Files**:
- `index.html`: Login form interface
- `script.js`: Authentication logic
- `style.css`: Authentication page styles
- `icons.js`: Authentication-specific icons

**Features**:
- Email/password login form
- Turnstile CAPTCHA integration
- Supabase authentication
- Error message display
- Loading states
- Password recovery (planned)
- Social login (planned)

**API Endpoints Used**:
- `POST /api/auth/turnstile`: Verify CAPTCHA
- `POST /api/auth/session`: Exchange tokens
- `POST /api/auth/check`: Validate session

**Routing**: `/pages/auth` or `/auth`

**Key Features**:
```javascript
// Authentication flow
async function handleLogin(email, password, turnstileToken) {
  // Verify Turnstile
  const turnstileResult = await verifyTurnstile(turnstileToken);
  
  // Authenticate with Supabase
  const authResult = await authenticate(email, password);
  
  // Exchange for session token
  const session = await exchangeToken(authResult.access_token);
  
  // Store session and redirect
  localStorage.setItem('session_token', session.token);
  window.location.href = '/pages/home';
}
```

### Home Dashboard (`home/`)

**Purpose**: Main dashboard and landing page

**Files**:
- `index.html`: Dashboard layout
- `script.js`: Dashboard logic
- `style.css`: Dashboard styles
- `mesh3d.js`: 3D mesh animations

**Features**:
- Welcome message with user name
- Quick access cards to main features
- Recent activity overview
- Academic statistics summary
- 3D animated background
- Responsive grid layout
- Theme toggle

**API Endpoints Used**:
- `GET /api/settings/stats`: User statistics
- `GET /api/ed/info`: Student information

**Routing**: `/pages/home`, `/`, `/pages/`

**Key Features**:
```javascript
// Dashboard initialization
async function initDashboard() {
  // Load user statistics
  const stats = await fetchUserStats();
  updateStatsDisplay(stats);
  
  // Load student information
  const studentInfo = await fetchStudentInfo();
  updateWelcomeMessage(studentInfo);
  
  // Initialize 3D background
  init3DBackground();
}
```

### Settings Pages (`settings/`)

**Purpose**: User settings and application customization

**Files**:
- `index.html`: Settings interface
- `script.js`: Settings management
- `style.css`: Settings page styles

**Features**:
- Theme customization (dark/light mode)
- Language selection
- Notification preferences
- Account settings
- Privacy settings
- Profile management
- Connected accounts

**API Endpoints Used**:
- `GET /api/settings/customization`: Get user settings
- `PUT /api/settings/customization`: Update settings

**Routing**: `/pages/settings` or `/settings`

**Key Features**:
```javascript
// Settings management
async function updateSettings(newSettings) {
  const response = await fetch('/api/settings/customization', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newSettings)
  });
  
  // Apply settings locally
  applySettings(newSettings);
}
```

### Workspace Management (`workspace/`)

**Purpose**: File organization and workspace management

**Files**:
- `index.html`: Main workspace interface
- `index2.html`: Parent workspace variant
- `script.js`: Workspace logic
- `script2.js`: Parent workspace logic
- `style.css`: Workspace styles
- `icons.js`: Workspace icons

**Features**:
- File browser interface
- Folder organization
- File upload/download
- File sharing
- Collaboration tools
- Parent access controls
- Workspace sharing
- Storage management

**API Endpoints Used**:
- `GET /api/files/*`: File operations
- `POST /api/files/upload`: Upload files
- `DELETE /api/files/*`: Delete files

**Routing**: `/pages/workspace` or `/pages/parent`

**Key Features**:
```javascript
// File management
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });
  
  refreshFileList();
}
```

### Study Notes (`study-notes/`)

**Purpose**: Note-taking and study materials management

**Files**:
- `index.html`: Notes interface
- `script.js`: Notes management
- `style.css`: Notes page styles

**Features**:
- Rich text editing
- Note organization by subject
- Search functionality
- Export options (PDF, Markdown)
- Collaboration features
- Note templates
- Version history (planned)
- AI-powered summarization (planned)

**API Endpoints Used**:
- `GET /api/study-notes/*`: Retrieve notes
- `POST /api/study-notes/*`: Create/update notes
- `DELETE /api/study-notes/*`: Delete notes

**Routing**: `/pages/study-notes` or `/study-notes`

**Key Features**:
```javascript
// Note management
async function saveNote(noteId, content, title) {
  const response = await fetch(`/api/study-notes/${noteId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, title })
  });
  
  showSaveNotification();
}
```

### Tools Interface (`tools/`)

**Purpose**: Productivity and utility tools

**Files**:
- `index.html`: Tools dashboard
- `script.js`: Tools logic
- `style.css`: Tools page styles
- `icons.js`: Tool-specific icons

**Features**:
- Pomodoro timer
- Scientific calculator
- Unit converter
- Study planner
- GPA calculator
- Deadline tracker
- Flashcard creator (planned)

**API Endpoints Used**:
- `GET/POST /api/pomodoro/*`: Pomodoro sessions
- `POST /api/tools/*`: Tool operations

**Routing**: `/pages/tools`

**Key Features**:
```javascript
// Pomodoro timer
class PomodoroTimer {
  constructor(duration = 25) {
    this.duration = duration * 60; // Convert to seconds
    this.timeLeft = this.duration;
    this.interval = null;
  }
  
  start() {
    this.interval = setInterval(() => {
      this.timeLeft--;
      updateDisplay(this.timeLeft);
      
      if (this.timeLeft <= 0) {
        this.stop();
        notifyCompletion();
      }
    }, 1000);
  }
}
```

### File Management (`files/`)

**Purpose**: Cloud storage and file management

**Files**:
- `index.html`: File browser
- `script.js`: File operations
- `style.css`: File browser styles

**Features**:
- File upload/download
- Folder creation and management
- File sharing
- Storage usage tracking
- File preview
- Bulk operations
- MEGA integration

**API Endpoints Used**:
- `GET /api/files/*`: File operations
- `POST /api/files/upload`: Upload files
- `DELETE /api/files/*`: Delete files

**Routing**: `/pages/files`

**Key Features**:
```javascript
// File upload with progress
async function uploadFileWithProgress(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = (event) => {
    const progress = (event.loaded / event.total) * 100;
    updateProgressBar(progress);
  };
  
  xhr.open('POST', '/api/files/upload');
  xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
  xhr.send(formData);
}
```

### AI Chat Interface (`ai/`)

**Purpose**: AI-powered tutoring and assistance

**Files**:
- `index.html`: Chat interface
- `script.js`: Chat logic
- `style.css`: Chat page styles

**Features**:
- Real-time AI conversation
- Multiple AI model selection
- Conversation history
- Context management
- File attachment support
- Voice input (planned)
- Code execution (planned)
- Image analysis (planned)

**API Endpoints Used**:
- `GET /api/ai/categories`: Get available models
- `POST /api/ai/chat`: Send message to AI
- `GET /api/ai/conversations`: Get conversation history
- `DELETE /api/ai/conversations/:id`: Delete conversation

**Routing**: `/pages/ai`

**Key Features**:
```javascript
// AI chat interaction
async function sendMessage(message, model, conversationId) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      category: 'basic',
      model: model,
      prompt: message,
      conversationId: conversationId
    })
  });
  
  const data = await response.json();
  displayMessage(data.response, 'ai');
  updateConversationId(data.conversationId);
}
```

### Website Management (`websites/`)

**Purpose**: Productivity-focused website blocking and management

**Files**:
- `index.html`: Website blocker interface
- `script.js`: Website management logic
- `style.css`: Website page styles

**Features**:
- Website blocking rules
- Time-based restrictions
- Category blocking
- Whitelist management
- Usage statistics
- Focus mode (planned)
- Smart scheduling (planned)

**API Endpoints Used**:
- `GET /api/websites/*`: Get blocking rules
- `POST /api/websites/*`: Create/update rules
- `DELETE /api/websites/*`: Delete rules

**Routing**: `/pages/websites`

**Key Features**:
```javascript
// Website blocking rule
async function addBlockingRule(domain, schedule, category) {
  const response = await fetch('/api/websites', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      domain,
      schedule,
      category,
      enabled: true
    })
  });
  
  refreshRulesList();
}
```

### Error Pages (`error-token/`)

**Purpose**: Error handling and user feedback

**Files**:
- `index.html`: Error page template
- `style.css`: Error page styles

**Features**:
- Token expiration handling
- Authentication error display
- Network error messages
- Recovery options
- User-friendly error messages
- Support contact information

**Routing**: Various error routes

**Key Features**:
```javascript
// Error handling
function showError(errorCode, message) {
  const errorMessages = {
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'INVALID_TOKEN': 'Invalid authentication token.',
    'NETWORK_ERROR': 'Network error. Please check your connection.'
  };
  
  displayError(errorMessages[errorCode] || message);
  showRecoveryOptions(errorCode);
}
```

---

## 🧭 Page Routing

### Route Structure

Pages are accessible through multiple routes:

**Direct Routes**:
- `/pages/[page-name]`: Direct page access
- `/[page-name]`: Short route for main pages
- `/`: Redirects to home page

**Special Routes**:
- `/pages/parent`: Parent workspace variant
- `/study-notes`: Alias for study-notes page
- `/settings`: Alias for settings page

### Route Handling

Route handling is managed in the main `src/index.js`:

```javascript
// Page routing logic
if (url.pathname === "/" || url.pathname === "/pages/") {
  return env.ASSETS.fetch(new Request("/pages/home/index.html", request));
}

if (url.pathname === "/settings") {
  return env.ASSETS.fetch(new Request("/pages/settings/index.html", request));
}

const pageMatch = url.pathname.match(/^\/pages\/([^/]+)\/?$/);
if (pageMatch) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = `/pages/${pageMatch[1]}/index.html`;
  return env.ASSETS.fetch(new Request(assetUrl, request));
}
```

### Navigation

Navigation between pages uses standard HTML links:

```html
<!-- Standard navigation -->
<a href="/pages/home">Home</a>
<a href="/pages/settings">Settings</a>

<!-- JavaScript navigation -->
window.location.href = '/pages/workspace';
```

---

## 🧩 Shared Components

### Navigation Bar

All pages include a navigation bar component for consistent navigation:

```javascript
import { Navbar } from '../components/navbar.js';
const navbar = new Navbar('navbar-container');
navbar.render();
```

### Authentication Guard

Protected pages implement authentication checks:

```javascript
function checkAuthentication() {
  const token = localStorage.getItem('session_token');
  if (!token) {
    window.location.href = '/pages/auth';
    return false;
  }
  return true;
}
```

### Theme Support

All pages support dark/light theme switching:

```javascript
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

---

## 🛠️ Development Guidelines

### Creating a New Page

1. **Create page directory**:
```bash
mkdir src/frontend/pages/new-page
```

2. **Create HTML file** (`index.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Page - Lumaris</title>
  <link rel="stylesheet" href="/styles/global.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="navbar-container"></div>
  <main>
    <h1>New Page</h1>
    <!-- Page content -->
  </main>
  <script type="module" src="../components/navbar.js"></script>
  <script type="module" src="script.js"></script>
</body>
</html>
```

3. **Create JavaScript file** (`script.js`):
```javascript
// Page initialization
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

async function initPage() {
  // Authentication check
  if (!checkAuthentication()) return;
  
  // Initialize components
  await loadPageData();
  
  // Setup event listeners
  setupEventListeners();
}
```

4. **Create CSS file** (`style.css`):
```css
/* Page-specific styles */
main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--primary-color);
}
```

5. **Add route handling** in `src/index.js`:
```javascript
if (url.pathname === "/pages/new-page") {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/pages/new-page/index.html";
  return env.ASSETS.fetch(new Request(assetUrl, request));
}
```

### Code Standards

**HTML**:
- Use semantic HTML5 elements
- Include proper meta tags
- Implement ARIA labels
- Use proper heading hierarchy
- Include alt text for images

**JavaScript**:
- Use modern ES6+ syntax
- Implement error handling
- Avoid global namespace pollution
- Use async/await for API calls
- Add comments for complex logic

**CSS**:
- Use CSS custom properties
- Implement responsive design
- Follow BEM naming convention
- Include print styles
- Optimize for performance

---

## 📱 Responsive Design

### Breakpoints

Standard breakpoints used across all pages:

```css
/* Mobile */
@media (max-width: 768px) {
  /* Mobile-specific styles */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet-specific styles */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Desktop-specific styles */
}
```

### Mobile-First Approach

All pages follow mobile-first design principles:

1. **Base styles**: Mobile layout
2. **Enhancements**: Tablet and desktop features
3. **Touch optimization**: Larger touch targets
4. **Performance**: Optimized for mobile networks

---

## ♿ Accessibility

### WCAG AA Compliance

All pages aim for WCAG AA compliance:

**Semantic HTML**:
- Proper heading hierarchy
- Semantic elements (`<nav>`, `<main>`, `<section>`)
- Landmark regions
- Proper form labels

**Keyboard Navigation**:
- Full keyboard accessibility
- Visible focus indicators
- Logical tab order
- Skip navigation links

**Screen Reader Support**:
- ARIA labels and roles
- Alt text for images
- Descriptive link text
- Error announcements

**Color Contrast**:
- Minimum 4.5:1 contrast ratio
- Color-independent information
- Focus on readability

---

## 🧪 Testing

### Manual Testing Checklist

For each page, test:

- [ ] Page loads correctly
- [ ] Responsive design works on all devices
- [ ] Forms validate properly
- [ ] Authentication flow works
- [ ] API calls function correctly
- [ ] Error handling displays properly
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Theme switching works
- [ ] Performance is acceptable

### Browser Testing

Test across:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📚 Additional Documentation

For detailed information about specific components or libraries, see:

- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/components/README.md" /> - Components documentation
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/lib/README.md" /> - Libraries documentation

---

## 🚀 Deployment

Pages are deployed as static assets through Cloudflare Workers Assets:

```bash
# Deploy with the main worker
wrangler deploy
```

Assets are automatically optimized and served through Cloudflare CDN.

---

## 📝 Notes

- Each page is self-contained and independently loadable
- Pages share common components and libraries
- All pages support dark/light theme switching
- Responsive design is implemented across all pages
- Accessibility features are integrated throughout
- Performance optimization is a priority

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>