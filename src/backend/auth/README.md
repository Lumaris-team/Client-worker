# Authentication Service

This directory contains the authentication and authorization services for the Lumaris platform. It handles user authentication, session management, token validation, and security features like Turnstile CAPTCHA verification.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Token Management](#-token-management)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The authentication service provides a comprehensive security layer for the Lumaris platform, integrating with Supabase for user management and Cloudflare Turnstile for bot protection. The service handles:

- **User Authentication**: Login, logout, and session management
- **Token Management**: JWT token generation and validation
- **Security**: CAPTCHA verification and rate limiting
- **Session Handling**: Secure session token management
- **Authorization**: Access control and permission checks

### Security Architecture

The authentication system uses a dual-token approach:

1. **Supabase Access Token**: Long-lived token from Supabase authentication
2. **Server Session Token**: Short-lived JWT token issued by the server

This provides enhanced security by limiting the exposure of long-lived tokens.

---

## 🏗️ Architecture

### Authentication Flow

```
1. User Login → Supabase Authentication
2. Supabase Token → Client receives access_token
3. Token Exchange → Client sends access_token to /api/auth/session
4. Server Verification → Server validates Supabase token
5. Session Token → Server issues short-lived JWT
6. API Calls → Client uses session token for API requests
7. Token Refresh → Automatic refresh on expiration
```

### Module Structure

```
auth/
├── index.js          # Main authentication API handler
├── supabase_jwt.js   # Supabase JWT verification
├── session.js        # Session token management
├── turnstile.js      # Turnstile CAPTCHA verification
└── encoding.js       # Encoding utilities
```

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main authentication API handler

**Key Function**:
```javascript
export async function Auth(env, path, method, body, request)
```

**Routes**:
- `POST /api/auth/turnstile`: Verify Turnstile token
- `POST /api/auth/session`: Exchange Supabase token for session token
- `POST /api/auth/check`: Validate session token

**Usage**:
```javascript
import { Auth } from './backend/auth/index.js';

const response = await Auth(env, 'session', 'POST', body, request);
```

### Supabase JWT Verification (`supabase_jwt.js`)

**Purpose**: Verify Supabase JWT tokens

**Key Function**:
```javascript
export async function verifySupabaseToken(token, supabaseUrl)
```

**Process**:
1. Extract JWT from token
2. Verify signature using Supabase JWT secret
3. Check token expiration
4. Extract user payload
5. Return validation result

**Response**:
```javascript
{
  valid: true,
  payload: {
    user_id: "user_id",
    email: "user@example.com",
    exp: 1234567890
  }
}
```

### Session Management (`session.js`)

**Purpose**: Manage server session tokens

**Key Functions**:
```javascript
export async function issueSessionToken(env, payload)
export async function verifySessionToken(env, token)
```

**Token Structure**:
```javascript
{
  user_id: "user_id",
  email: "user@example.com",
  iat: issued_at_timestamp,
  exp: expiration_timestamp
}
```

**Token Configuration**:
- **Expiration**: 1 hour (3600 seconds)
- **Algorithm**: HS256
- **Secret**: Configured in environment variables

### Turnstile Verification (`turnstile.js`)

**Purpose**: Verify Cloudflare Turnstile CAPTCHA tokens

**Key Function**:
```javascript
export async function verifyTurnstileToken(env, token, remoteip)
```

**Process**:
1. Extract token from request
2. Send verification request to Cloudflare
3. Check response validity
4. Return verification result

**Response**:
```javascript
{
  success: true,
  reason: "valid"
}
```

### Encoding Utilities (`encoding.js`)

**Purpose**: Provide encoding and decoding utilities

**Functions**:
- Base64 encoding/decoding
- URL-safe encoding
- JWT encoding/decoding helpers

---

## 🔌 API Endpoints

### POST `/api/auth/turnstile`

Verify Turnstile CAPTCHA token before login.

**Request Body**:
```json
{
  "token": "turnstile_token_string"
}
```

**Headers**:
```
CF-Connecting-IP: client_ip_address
```

**Response**:
```json
{
  "success": true,
  "reason": "valid"
}
```

**Error Response**:
```json
{
  "success": false,
  "reason": "invalid_token"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/auth/turnstile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: turnstileToken })
});

const result = await response.json();
if (result.success) {
  // Proceed with login
}
```

### POST `/api/auth/session`

Exchange Supabase access token for server session token.

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
  "token": "server_session_token",
  "exp": 1234567890,
  "expiresIn": 3600
}
```

**Error Response**:
```json
{
  "valid": false,
  "reason": "invalid_supabase_token"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: supabaseToken })
});

const result = await response.json();
if (result.valid) {
  localStorage.setItem('session_token', result.token);
}
```

### POST `/api/auth/check`

Validate server session token.

**Request Body**:
```json
{
  "token": "server_session_token"
}
```

**Response**:
```json
{
  "valid": true,
  "reason": "valid"
}
```

**Error Response**:
```json
{
  "valid": false,
  "reason": "token_expired"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/auth/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: sessionToken })
});

const result = await response.json();
if (!result.valid) {
  // Redirect to login
}
```

---

## 🔒 Security Features

### Turnstile CAPTCHA

**Purpose**: Prevent automated bot attacks

**Implementation**:
- Invisible CAPTCHA mode
- Token verification before login
- IP-based validation
- Graceful degradation when not configured

**Configuration**:
```toml
[vars]
TURNSTILE_SECRET_KEY = "your_secret_key"
```

### JWT Token Security

**Features**:
- Short-lived session tokens (1 hour expiration)
- Secure token generation using environment secrets
- Token signature verification
- Expiration time validation
- Automatic token refresh

**Configuration**:
```toml
[vars]
JWT_SECRET = "your_secure_random_key"
JWT = "your_additional_key"
```

### Session Management

**Features**:
- Secure session token storage
- Token expiration handling
- Session invalidation on logout
- Multi-device session support
- "Remember me" functionality

### Rate Limiting

**Implementation**:
- Per-IP rate limiting on authentication endpoints
- Exponential backoff for failed attempts
- Temporary account lockout after multiple failures
- Monitoring for suspicious activity

---

## 🔑 Token Management

### Session Token Lifecycle

1. **Issuance**: Token created after successful authentication
2. **Usage**: Token used for API requests
3. **Validation**: Token validated on each request
4. **Refresh**: Token refreshed before expiration
5. **Expiration**: Token invalidates after expiration time
6. **Revocation**: Token revoked on logout

### Token Structure

**Header**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**:
```json
{
  "user_id": "user_id",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Signature**: HMAC-SHA256 signature using JWT_SECRET

### Token Refresh Strategy

**Automatic Refresh**:
- Client checks token expiration before API calls
- If token expires within 5 minutes, request new token
- New token requested from `/api/auth/session`
- Failed refresh triggers redirect to login

**Manual Refresh**:
```javascript
async function refreshToken() {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: getAccessToken() })
  });
  
  const result = await response.json();
  if (result.valid) {
    localStorage.setItem('session_token', result.token);
  }
}
```

---

## 🛠️ Development Guidelines

### Adding New Authentication Methods

1. **Create new module** in `auth/` directory
2. **Implement verification logic**
3. **Add route to main handler**
4. **Update documentation**
5. **Add tests**

**Example**:
```javascript
// auth/new_method.js
export async function verifyNewMethod(token, env) {
  // Implementation
  return { valid: true, payload: {} };
}

// auth/index.js
import { verifyNewMethod } from './new_method.js';

if (path === "new-method" && method === "POST") {
  const result = await verifyNewMethod(body?.token, env);
  return result;
}
```

### Security Best Practices

**Token Storage**:
- Never store tokens in localStorage for sensitive operations
- Use httpOnly cookies for additional security
- Implement token encryption if needed
- Clear tokens on logout

**Input Validation**:
- Validate all input parameters
- Sanitize user input
- Implement length limits
- Check for SQL injection patterns

**Error Handling**:
- Never expose sensitive information in errors
- Use generic error messages for authentication failures
- Log detailed errors for debugging
- Implement rate limiting for error responses

### Testing Authentication

**Unit Testing**:
```javascript
test('verifySupabaseToken validates valid token', async () => {
  const result = await verifySupabaseToken(validToken, supabaseUrl);
  expect(result.valid).toBe(true);
});
```

**Integration Testing**:
```javascript
test('Auth endpoint exchanges tokens correctly', async () => {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: validToken })
  });
  
  const result = await response.json();
  expect(result.valid).toBe(true);
  expect(result.token).toBeDefined();
});
```

---

## 🔧 Troubleshooting

### Common Issues

**Token Verification Failing**:
- Check JWT_SECRET configuration
- Verify token format and structure
- Check token expiration time
- Verify Supabase configuration

**Turnstile Verification Failing**:
- Check TURNSTILE_SECRET_KEY configuration
- Verify token is not expired
- Check IP address forwarding
- Verify Cloudflare API access

**Session Token Expiring Too Quickly**:
- Check expiration time configuration
- Verify system time synchronization
- Check token refresh logic
- Monitor for clock skew

### Debugging

**Enable Debug Logging**:
```javascript
console.log("Auth request:", { path, method, body });
console.log("Token verification:", tokenResult);
console.log("Session issuance:", sessionResult);
```

**Monitor Token Usage**:
- Track token issuance rate
- Monitor validation failures
- Check for unusual patterns
- Set up alerts for suspicious activity

---

## 📚 Additional Resources

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🚀 Future Enhancements

Planned authentication improvements:

- **Multi-Factor Authentication**: Add 2FA support
- **OAuth Providers**: Additional OAuth providers (GitHub, Microsoft)
- **Biometric Authentication**: WebAuthn/FIDO2 support
- **Session Analytics**: Detailed session tracking
- **Advanced Rate Limiting**: More sophisticated rate limiting
- **Anomaly Detection**: ML-based fraud detection

---

## 📝 Notes

- All tokens use secure cryptographic algorithms
- Session tokens have short expiration for security
- Turnstile provides bot protection
- Supabase handles user management
- Error messages are generic for security
- Rate limiting prevents brute force attacks

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>