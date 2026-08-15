# Frontend Directory

This directory contains all client-side assets, pages, components, and styles for the Lumaris platform. The frontend is built with vanilla JavaScript, HTML5, and CSS3, served as static assets through Cloudflare Workers Assets binding.

## 📋 Table of Contents

- [Overview](#-overview)
- [Directory Structure](#-directory-structure)
- [Architecture](#-architecture)
- [Key Components](#-key-components)
- [Shared Libraries](#-shared-libraries)
- [Page Structure](#-page-structure)
- [Styling System](#-styling-system)
- [Asset Management](#-asset-management)
- [Development Guidelines](#-development-guidelines)
- [Performance Optimization](#-performance-optimization)

---

## 🎯 Overview

The frontend is a multi-page application (MPA) designed for optimal performance and simplicity. Each page is self-contained with its own HTML, CSS, and JavaScript, making it easy to maintain and deploy.

### Design Principles

- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **Mobile-First**: Responsive design optimized for all devices
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Accessibility**: WCAG AA compliant with semantic HTML
- **Performance**: Minimal bundle size with efficient asset loading

---

## 📁 Directory Structure

```
frontend/
├── assets/                 # Static assets
│   ├── logo/              # Brand logos and icons
│   ├── icons/             # UI icons and SVG files
│   ├── videos/            # Video content
│   │   └── presentation/  # Demo and tutorial videos
│   └── (other assets)     # Images, fonts, etc.
├── components/            # Reusable UI components
│   └── navbar.js         # Navigation bar component
├── lib/                   # Shared JavaScript libraries
│   ├── auth.js           # Authentication utilities
│   ├── supabase.js       # Supabase client configuration
│   ├── turnstile.js      # Turnstile CAPTCHA integration
│   ├── settings.js       # Settings management
│   └── icons.js          # Icon system utilities
├── pages/                 # Application pages
│   ├── auth/             # Authentication pages
│   ├── home/             # Home dashboard
│   ├── settings/         # Settings pages
│   ├── workspace/        # Workspace management
│   ├── study-notes/      # Study notes functionality
│   ├── tools/            # Productivity tools
│   ├── files/            # File management
│   ├── ai/               # AI chat interface
│   ├── websites/         # Website management
│   └── error-token/      # Error pages
└── styles/               # Global CSS styles
    ├── sidebar.css       # Sidebar component styles
    └── block.css         # Block component styles
```

---

## 🏗️ Architecture

### Component System

The frontend uses a lightweight component system:

- **Navbar**: Global navigation component
- **Sidebar**: Collapsible sidebar for navigation
- **Blocks**: Reusable content blocks
- **Icons**: Consistent icon system

### Page Architecture

Each page follows a consistent structure:

```
pages/[page-name]/
├── index.html          # Page HTML structure
├── script.js          # Page-specific JavaScript
├── style.css          # Page-specific styles
└── icons.js          # Page-specific icons (optional)
```

### Asset Loading Strategy

- **Critical CSS**: Inline critical styles for fast rendering
- **Lazy Loading**: Non-critical assets loaded on demand
- **CDN Delivery**: All assets served through Cloudflare CDN
- **Caching**: Aggressive caching headers for static assets

---

## 🔑 Key Components

### Navbar Component (`components/navbar.js`)

**Features:**
- Responsive navigation menu
- User authentication status display
- Theme toggle (dark/light mode)
- Mobile hamburger menu

**Usage:**
```javascript
import { Navbar } from '../components/navbar.js';
const navbar = new Navbar(container);
```

### Shared Libraries

#### Authentication (`lib/auth.js`)

**Functions:**
- `login(email, password)`: User authentication
- `logout()`: Session termination
- `getSession()`: Get current session
- `isAuthenticated()`: Check authentication status

#### Supabase Client (`lib/supabase.js`)

**Features:**
- Supabase client initialization
- Database queries
- Real-time subscriptions
- File storage operations

#### Turnstile (`lib/turnstile.js`)

**Functions:**
- `renderTurnstile(container)`: Render CAPTCHA widget
- `verifyToken(token)`: Verify Turnstile token
- `reset()`: Reset CAPTCHA widget

#### Settings (`lib/settings.js`)

**Functions:**
- `getSettings()`: Retrieve user settings
- `updateSettings(settings)`: Update user preferences
- `resetSettings()`: Reset to defaults

#### Icons (`lib/icons.js`)

**Features:**
- Icon registration system
- SVG icon rendering
- Icon caching
- Custom icon support

---

## 📄 Page Structure

### Authentication Pages (`pages/auth/`)

**Files:**
- `index.html`: Login form interface
- `script.js`: Authentication logic
- `style.css`: Authentication page styles
- `icons.js`: Authentication-specific icons

**Features:**
- Login form with email/password
- Turnstile CAPTCHA integration
- Supabase authentication
- Error handling and validation
- Password recovery (planned)

### Home Dashboard (`pages/home/`)

**Files:**
- `index.html`: Dashboard layout
- `script.js`: Dashboard logic
- `style.css`: Dashboard styles
- `mesh3d.js`: 3D mesh animations

**Features:**
- Welcome message and user stats
- Quick access to main features
- Recent activity overview
- 3D animated background
- Responsive grid layout

### Settings Pages (`pages/settings/`)

**Files:**
- `index.html`: Settings interface
- `script.js`: Settings management
- `style.css`: Settings page styles

**Features:**
- Theme customization
- Language selection
- Notification preferences
- Account settings
- Privacy settings

### Workspace Management (`pages/workspace/`)

**Files:**
- `index.html`: Main workspace interface
- `index2.html`: Parent workspace variant
- `script.js`: Workspace logic
- `script2.js`: Parent workspace logic
- `style.css`: Workspace styles
- `icons.js`: Workspace icons

**Features:**
- File organization
- Task management
- Collaboration tools
- Parent access controls
- Workspace sharing

### Study Notes (`pages/study-notes/`)

**Files:**
- `index.html`: Notes interface
- `script.js`: Notes management
- `style.css`: Notes page styles

**Features:**
- Rich text editing
- Note organization
- Search functionality
- Export options
- Collaboration features

### Tools Interface (`pages/tools/`)

**Files:**
- `index.html`: Tools dashboard
- `script.js`: Tools logic
- `style.css`: Tools page styles
- `icons.js`: Tool-specific icons

**Features:**
- Pomodoro timer
- Calculator
- Unit converter
- Study planner
- Productivity trackers

### File Management (`pages/files/`)

**Files:**
- `index.html`: File browser
- `script.js`: File operations
- `style.css`: File browser styles

**Features:**
- File upload/download
- Folder organization
- File sharing
- Storage management
- MEGA integration

### AI Chat Interface (`pages/ai/`)

**Files:**
- `index.html`: Chat interface
- `script.js`: Chat logic
- `style.css`: Chat page styles

**Features:**
- Real-time AI conversation
- Message history
- Context management
- File attachment support
- Voice input (planned)

### Website Management (`pages/websites/`)

**Files:**
- `index.html`: Website blocker interface
- `script.js`: Website management logic
- `style.css`: Website page styles

**Features:**
- Website blocking rules
- Time-based restrictions
- Category blocking
- Whitelist management
- Usage statistics

### Error Pages (`pages/error-token/`)

**Files:**
- `index.html`: Error page template
- `style.css`: Error page styles

**Features:**
- Token expiration handling
- Authentication error display
- Recovery options
- User-friendly error messages

---

## 🎨 Styling System

### Global Styles (`styles/`)

#### Sidebar Styles (`sidebar.css`)

**Components:**
- Navigation sidebar
- Collapsible menu items
- Active state indicators
- Responsive behavior

#### Block Styles (`block.css`)

**Components:**
- Content blocks
- Card layouts
- Grid systems
- Responsive containers

### Page-Specific Styles

Each page has its own `style.css` file for:

- Page-specific layouts
- Component variations
- Responsive breakpoints
- Theme-specific styles

### CSS Architecture

**Methodology:**
- BEM naming convention for classes
- CSS custom properties for theming
- Mobile-first responsive design
- Utility classes for common patterns

**Theme System:**
```css
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --background-color: #ffffff;
  --text-color: #333333;
}

[data-theme="dark"] {
  --background-color: #1a1a1a;
  --text-color: #ffffff;
}
```

---

## 📦 Asset Management

### Logo Assets (`assets/logo/`)

**Contents:**
- Main application logo
- Favicon files
- Brand variations
- Transparent versions

### Icon Assets (`assets/icons/`)

**Contents:**
- UI icons (SVG format)
- Feature-specific icons
- Status indicators
- Navigation icons

### Video Assets (`assets/videos/`)

**Contents:**
- Demo videos
- Tutorial content
- Presentation materials
- Background videos

### Asset Optimization

**Strategies:**
- SVG icons for scalability
- Compressed images for performance
- Lazy loading for videos
- WebP format for images
- Minified CSS and JavaScript

---

## 🛠️ Development Guidelines

### File Naming Conventions

- **HTML files**: `index.html` for each page
- **JavaScript files**: `script.js` for page logic
- **CSS files**: `style.css` for page styles
- **Component files**: Descriptive names (e.g., `navbar.js`)

### Code Organization

1. **HTML Structure**: Semantic HTML5 elements
2. **JavaScript**: Modular functions with clear namespacing
3. **CSS**: BEM naming with organized sections
4. **Comments**: JSDoc for JavaScript, CSS comments for styles

### Best Practices

**HTML:**
- Use semantic elements (`<nav>`, `<main>`, `<section>`)
- Include proper meta tags
- Implement ARIA labels for accessibility
- Optimize for SEO with proper headings

**JavaScript:**
- Use modern ES6+ syntax
- Implement error handling
- Avoid global namespace pollution
- Use event delegation for dynamic content

**CSS:**
- Use CSS custom properties for theming
- Implement responsive design with media queries
- Optimize for performance with efficient selectors
- Ensure cross-browser compatibility

### Accessibility Standards

- **Semantic HTML**: Proper use of HTML5 elements
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Focus Indicators**: Clear focus states for interactive elements

---

## ⚡ Performance Optimization

### Loading Strategies

1. **Critical CSS**: Inline critical CSS for above-the-fold content
2. **JavaScript Deferment**: Load non-critical JavaScript after page load
3. **Image Optimization**: Use modern formats (WebP, AVIF)
4. **Asset Compression**: Gzip/Brotli compression
5. **CDN Delivery**: Cloudflare CDN for global distribution

### Caching Strategy

```http
Cache-Control: public, max-age=31536000, immutable
ETag: "asset-version-hash"
```

### Code Splitting

- Page-specific JavaScript loaded only when needed
- Shared libraries cached separately
- Critical JavaScript inline for first paint
- Non-critical features lazy-loaded

### Performance Metrics

**Targets:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] All pages load correctly
- [ ] Responsive design works on all devices
- [ ] Forms validate properly
- [ ] Authentication flow works
- [ ] Dark/light theme toggles correctly
- [ ] All interactive elements function
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

### Browser Testing

Test across:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📚 Additional Documentation

For detailed information about specific pages or components, see:

- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/pages/README.md" /> - Pages documentation
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/components/README.md" /> - Components documentation
- <ref_file file="/Users/danielersen/Projets/Lumaris/client-worker/src/frontend/lib/README.md" /> - Libraries documentation

---

## 🚀 Deployment

Frontend assets are deployed through Cloudflare Workers Assets binding:

```bash
# Assets are automatically deployed with the worker
wrangler deploy
```

Assets are served from:
- Production: Custom domain
- Development: Workers.dev domain (if enabled)

---

## 📝 Notes

- All frontend code is client-side only
- No server-side rendering (SSR)
- Static asset serving through Cloudflare CDN
- Progressive enhancement approach
- Designed for edge deployment

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>