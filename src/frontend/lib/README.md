# Frontend Libraries Directory

This directory contains shared JavaScript libraries and utilities that are used across multiple pages in the Lumaris platform. These libraries provide common functionality for authentication, API communication, settings management, and UI components.

## 📋 Table of Contents

- [Overview](#-overview)
- [Available Libraries](#-available-libraries)
- [Authentication Library](#authentication-library-authjs)
- [Supabase Library](#supabase-library-supabasejs)
- [Turnstile Library](#turnstile-library-turnstilejs)
- [Settings Library](#settings-library-settingsjs)
- [Icons Library](#icons-library-iconsjs)
- [Usage Patterns](#-usage-patterns)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The libraries directory provides reusable functionality that is shared across the frontend application. These libraries handle:

- **Authentication**: User login, session management, and token handling
- **API Communication**: Supabase client configuration and API calls
- **Security**: Turnstile CAPTCHA integration for bot protection
- **Settings**: User preferences and theme management
- **UI Components**: Icon system and UI utilities

### Design Principles

- **Modularity**: Each library is self-contained and independently usable
- **Reusability**: Functions are designed for use across multiple pages
- **Error Handling**: Comprehensive error handling and fallbacks
- **Performance**: Optimized for fast loading and execution
- **Security**: Secure handling of tokens and sensitive data

---

## 📚 Available Libraries

### Authentication Library (`auth.js`)

**Purpose**: Handle user authentication, session management, and page protection

**Key Functions**:
- `guardPage()`: Protect pages requiring authentication
- `ensureSessionToken()`: Ensure valid session token is available
- `authedFetch(input, init)`: Authenticated API calls with token refresh
- `logout()`: User logout and session cleanup
- `appendAuthParams(href)`: Append auth parameters to URLs
- `navigateWithAuth(href)`: Navigate with authentication context

**Storage Management**:
- Uses localStorage for "remember me" functionality
- Uses sessionStorage for temporary sessions
- Manages both Supabase tokens and server session tokens
- Handles token expiration and refresh

**Authentication Flow**:
1. User logs in via Supabase
2. Tokens captured from URL hash
3. Server session token requested
4. Session token used for API calls
5. Automatic token refresh on expiration

**Usage Example**:
```javascript
import { guardPage, authedFetch, logout } from '/lib/auth.js';

// Protect a page
document.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await guardPage();
  if (!authenticated) return;
  
  // Load page content
  loadPageContent();
});

// Make authenticated API call
const response = await authedFetch('/api/user/data');
const data = await response.json();

// Logout user
logout();
```

**Page Protection**:
```javascript
// At the top of any protected page
import { guardPage } from '/lib/auth.js';

if (!(await guardPage())) {
  // User is redirected to login if not authenticated
  document.body.style.display = 'none';
}
```

**Token Management**:
```javascript
import { ensureSessionToken } from '/lib/auth.js';

// Get valid session token
const token = await ensureSessionToken();
if (token) {
  // Use token for API calls
}
```

**Navigation with Auth**:
```javascript
import { navigateWithAuth, appendAuthParams } from '/lib/auth.js';

// Navigate with authentication context
navigateWithAuth('/pages/workspace');

// Append auth params to URL
const url = appendAuthParams('/api/data');
```

---

### Supabase Library (`supabase.js`)

**Purpose**: Supabase client configuration and authentication

**Key Functions**:
- `signInWithEmail(email, password, remember)`: Email/password authentication
- `signInWithProvider(provider, remember)`: OAuth authentication
- `signOut()`: Sign out from Supabase
- `getRestoredSession()`: Get persisted session
- `persistSession(accessToken, refreshToken)`: Persist session tokens
- `getTurnstileSiteKey()`: Get Turnstile site key
- `checkConfig()`: Verify Supabase configuration

**Configuration**:
- Loads Supabase URL and anon key from `/api/config`
- Configures client with proper storage backend
- Handles session persistence based on "remember me" preference
- Manages client caching for performance

**Remember Me Functionality**:
```javascript
import { setRememberPref, getRememberPref } from '/lib/supabase.js';

// Set remember preference
setRememberPref(true); // User stays logged in
setRememberPref(false); // Session cleared on tab close

// Get current preference
const remember = getRememberPref();
```

**Email Authentication**:
```javascript
import { signInWithEmail } from '/lib/supabase.js';

const { data, error } = await signInWithEmail(
  'user@example.com',
  'password123',
  true // remember me
);

if (error) {
  console.error('Login failed:', error);
} else {
  console.log('Login successful:', data);
}
```

**OAuth Authentication**:
```javascript
import { signInWithProvider } from '/lib/supabase.js';

const { error } = await signInWithProvider('google', true);

if (error) {
  console.error('OAuth failed:', error);
}
// User is redirected to OAuth provider
```

**Configuration Check**:
```javascript
import { checkConfig } from '/lib/supabase.js';

const { ok, missing } = await checkConfig();
if (!ok) {
  console.error('Missing configuration:', missing);
}
```

---

### Turnstile Library (`turnstile.js`)

**Purpose**: Cloudflare Turnstile CAPTCHA integration for bot protection

**Key Functions**:
- `getTurnstileToken()`: Get fresh Turnstile token
- `preloadTurnstile()`: Preload Turnstile script for performance

**Features**:
- Invisible CAPTCHA mode
- Automatic token refresh
- Graceful degradation when not configured
- Preloading for better performance

**Usage Example**:
```javascript
import { getTurnstileToken, preloadTurnstile } from '/lib/turnstile.js';

// Preload Turnstile for better performance
preloadTurnstile();

// Get token before login
const token = await getTurnstileToken();
if (token) {
  // Send token to server for verification
  await verifyTurnstile(token);
}
```

**Login Integration**:
```javascript
import { getTurnstileToken } from '/lib/turnstile.js';

async function handleLogin(email, password) {
  // Get Turnstile token
  const turnstileToken = await getTurnstileToken();
  
  // Send to server with login credentials
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      turnstileToken
    })
  });
  
  return response.json();
}
```

**Error Handling**:
```javascript
import { getTurnstileToken } from '/lib/turnstile.js';

try {
  const token = await getTurnstileToken();
  if (!token) {
    console.warn('Turnstile not configured or failed');
    // Proceed without CAPTCHA
  }
} catch (error) {
  console.error('Turnstile error:', error);
  // Handle error gracefully
}
```

---

### Settings Library (`settings.js`)

**Purpose**: User settings and theme management

**Key Functions**:
- `loadSettings()`: Load settings from localStorage
- `saveSettings(settings)`: Save settings to localStorage
- `applyThemeSettings(settings)`: Apply theme settings to DOM
- `fetchRemoteSettings()`: Fetch settings from server
- `saveRemoteSettings(settings)`: Save settings to server
- `defaultSettings()`: Get default settings

**Settings Structure**:
```javascript
{
  backgroundType: "gradient",        // "gradient" or "solid"
  gradientStyle: "linear",          // "linear" or "radial"
  gradientOrientation: "135deg",     // CSS gradient angle
  color1: "#0b3f91",                // Primary color
  color2: "#1c8cff",                // Secondary color
  solidColor: "#08100f",            // Solid background color
  fontFamily: "Inter, sans-serif",  // Font family
  fontWeight: "500",                 // Font weight
  fontSize: 16                      // Font size in pixels
}
```

**Font Presets**:
```javascript
{
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  ibm: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  poppins: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  lora: "'Lora', Georgia, serif"
}
```

**Usage Example**:
```javascript
import { loadSettings, saveSettings, applyThemeSettings } from '/lib/settings.js';

// Load current settings
const settings = loadSettings();

// Update settings
const newSettings = {
  ...settings,
  backgroundType: 'solid',
  solidColor: '#1a1a1a'
};

// Save and apply
saveSettings(newSettings);
applyThemeSettings(newSettings);
```

**Remote Settings**:
```javascript
import { fetchRemoteSettings, saveRemoteSettings } from '/lib/settings.js';

// Fetch from server
const remoteSettings = await fetchRemoteSettings();
if (remoteSettings) {
  saveSettings(remoteSettings);
}

// Save to server
await saveRemoteSettings(newSettings);
```

**Theme Application**:
```javascript
import { applyThemeSettings } from '/lib/settings.js';

// Apply theme immediately
applyThemeSettings({
  backgroundType: 'gradient',
  gradientStyle: 'linear',
  gradientOrientation: '45deg',
  color1: '#ff6b6b',
  color2: '#4ecdc4'
});
```

**Settings Form Integration**:
```javascript
import { loadSettings, saveSettings } from '/lib/settings.js';

// Initialize form with current settings
const settings = loadSettings();
document.getElementById('backgroundType').value = settings.backgroundType;
document.getElementById('color1').value = settings.color1;

// Save on form submit
document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const newSettings = {
    backgroundType: document.getElementById('backgroundType').value,
    color1: document.getElementById('color1').value,
    color2: document.getElementById('color2').value,
    // ... other settings
  };
  
  saveSettings(newSettings);
});
```

---

### Icons Library (`icons.js`)

**Purpose**: Icon system for UI components

**Key Functions**:
- `loadIcons(selector, customIcons)`: Load icons into DOM elements
- `getIconPath(name)`: Get icon file path by name
- `ICONS`: Icon name to path mapping

**Available Icons**:
- Navigation: `home`, `grid`, `settings`, `refresh`, `logout`, `more`
- Features: `sparkles`, `study-notes`, `web`, `database`, `wrench`
- File operations: `folder`, `file`, `download`, `upload`
- Academic: `homework`, `calendar`, `clock`, `subjects`
- Tools: `calculator`, `converter`, `code`, `statistics`
- Chat: `chat`, `chat-settings`, `send`, `copy`
- UI: `checkmark`, `eye-open`, `eye-closed`, `swap`, `play`
- Navigation: `arrow-left`, `arrow-right`, `warning`

**Usage Example**:
```javascript
import { loadIcons, getIconPath, ICONS } from '/lib/icons.js';

// Load icons into elements with data-icon attribute
loadIcons('[data-icon]');

// Load icons into specific container
const container = document.getElementById('my-component');
loadIcons(container);

// Get icon path
const iconPath = getIconPath('home');
console.log(iconPath); // '/assets/icons/home.svg'

// Use custom icon mapping
const customIcons = {
  'my-icon': '/custom-icons/my-icon.svg'
};
loadIcons('[data-icon]', customIcons);
```

**HTML Integration**:
```html
<!-- Icon placeholder -->
<span data-icon="/assets/icons/home.svg" data-icon-width="24" data-icon-height="24"></span>

<!-- Load icons -->
<script type="module">
  import { loadIcons } from '/lib/icons.js';
  loadIcons();
</script>
```

**Dynamic Icon Loading**:
```javascript
import { loadIcons } from '/lib/icons.js';

// Load icons after dynamic content is added
function addDynamicContent() {
  const container = document.getElementById('dynamic-content');
  container.innerHTML = '<span data-icon="/assets/icons/new-icon.svg"></span>';
  loadIcons(container);
}
```

**Custom Icon Sizes**:
```html
<span data-icon="/assets/icons/home.svg" 
      data-icon-width="32" 
      data-icon-height="32"></span>
```

---

## 🔧 Usage Patterns

### Initialization Pattern

Most libraries should be initialized early in the page load:

```javascript
import { guardPage } from '/lib/auth.js';
import { loadSettings } from '/lib/settings.js';
import { preloadTurnstile } from '/lib/turnstile.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Preload resources
  preloadTurnstile();
  
  // Check authentication
  if (!(await guardPage())) return;
  
  // Load settings
  const settings = loadSettings();
  applyThemeSettings(settings);
  
  // Initialize page
  initPage();
});
```

### Error Handling Pattern

Consistent error handling across libraries:

```javascript
import { authedFetch } from '/lib/auth.js';

try {
  const response = await authedFetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  processData(data);
} catch (error) {
  console.error('API call failed:', error);
  showError('Failed to load data');
}
```

### Settings Pattern

Consistent settings management:

```javascript
import { loadSettings, saveSettings, fetchRemoteSettings, saveRemoteSettings } from '/lib/settings.js';

async function syncSettings() {
  // Load local settings
  const localSettings = loadSettings();
  
  // Fetch remote settings
  const remoteSettings = await fetchRemoteSettings();
  
  if (remoteSettings) {
    // Merge settings (remote takes precedence)
    const mergedSettings = { ...localSettings, ...remoteSettings };
    saveSettings(mergedSettings);
  }
  
  return localSettings;
}
```

### Authentication Pattern

Consistent authentication checks:

```javascript
import { ensureSessionToken, authedFetch } from '/lib/auth.js';

async function authenticatedOperation() {
  const token = await ensureSessionToken();
  if (!token) {
    redirectToLogin();
    return;
  }
  
  const response = await authedFetch('/api/protected');
  return response.json();
}
```

---

## 🛠️ Development Guidelines

### Creating a New Library

1. **Define Purpose**: Clearly define what the library should do
2. **Export Functions**: Export public functions with clear names
3. **Add Documentation**: JSDoc comments for all public functions
4. **Handle Errors**: Implement comprehensive error handling
5. **Test Thoroughly**: Test across different browsers and scenarios

**Example Library Structure**:
```javascript
// lib/my-library.js

/**
 * Library description
 */

const CONSTANTS = {
  // Constants
};

/**
 * Public function description
 * @param {Type} param - Parameter description
 * @returns {Type} Return value description
 */
export function publicFunction(param) {
  try {
    // Implementation
    return result;
  } catch (error) {
    console.error('Function error:', error);
    return null;
  }
}

/**
 * Internal helper function
 */
function internalHelper() {
  // Implementation
}
```

### Best Practices

**Modularity**:
- Keep functions focused and single-purpose
- Avoid side effects in pure functions
- Use clear, descriptive function names
- Export only public API

**Error Handling**:
- Always handle potential errors
- Provide meaningful error messages
- Implement graceful degradation
- Log errors for debugging

**Performance**:
- Implement caching where appropriate
- Avoid unnecessary computations
- Use efficient algorithms
- Minimize DOM manipulation

**Security**:
- Never expose sensitive data
- Validate all inputs
- Use secure storage for tokens
- Implement proper cleanup

**Documentation**:
- Add JSDoc comments for all public functions
- Include usage examples
- Document parameters and return values
- Keep documentation up to date

### Testing Libraries

**Unit Testing**:
```javascript
test('loadSettings returns default settings when none exist', () => {
  const settings = loadSettings();
  expect(settings).toEqual(defaultSettings());
});
```

**Integration Testing**:
```javascript
test('authedFetch includes auth header', async () => {
  const response = await authedFetch('/api/test');
  expect(response.headers.get('Authorization')).toBeTruthy();
});
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## 🔧 Troubleshooting

### Common Issues

**Authentication Failing**:
- Check Supabase configuration
- Verify token storage
- Check network connectivity
- Review console errors

**Settings Not Applying**:
- Check localStorage availability
- Verify settings structure
- Check CSS custom properties
- Review console for errors

**Icons Not Loading**:
- Verify icon file paths
- Check network requests
- Verify CSS selectors
- Check console for errors

**Turnstile Not Working**:
- Verify site key configuration
- Check script loading
- Verify network connectivity
- Review console errors

---

## 🚀 Future Enhancements

Planned library additions:

- **i18n Library**: Internationalization support
- **Validation Library**: Form validation utilities
- **Analytics Library**: User analytics tracking
- **Storage Library**: Enhanced storage utilities
- **Notification Library**: In-app notification system

---

## 📝 Notes

- All libraries use ES modules for modern JavaScript support
- Libraries are designed for edge deployment compatibility
- Error handling is implemented throughout
- Performance optimization is a priority
- Security best practices are followed

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>