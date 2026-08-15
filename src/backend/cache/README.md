# Cache Service

This directory contains the caching layer for the Lumaris platform, using Cloudflare KV for high-performance key-value storage to optimize API responses and reduce load on external services.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [API Endpoints](#-api-endpoints)
- [Caching Strategies](#-caching-strategies)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The cache service provides a high-performance caching layer using Cloudflare KV storage to:

- **Reduce API Latency**: Cache frequently accessed data
- **Decrease External API Calls**: Minimize calls to external services
- **Improve Performance**: Serve cached responses quickly
- **Handle Traffic Spikes**: Manage increased load gracefully
- **Reduce Costs**: Lower external API usage costs

### Cache Benefits

- **Global Edge Network**: KV is distributed across Cloudflare's global network
- **Low Latency**: Cached data served from edge locations
- **High Availability**: Redundant storage across multiple locations
- **Automatic Scaling**: Handles traffic spikes automatically
- **Cost Effective**: Reduced external API calls

---

## 🏗️ Architecture

### Cache Architecture

```
Cache Layer
├── KV Storage (Cloudflare KV)
│   ├── API Responses
│   ├── Session Data
│   ├── Calculation History
│   └── Temporary Data
├── Cache Management
│   ├── Cache Invalidation
│   ├── TTL Management
│   ├── Cache Warming
│   └── Cache Monitoring
└── Cache Strategies
    ├── Cache-Aside
    ├── Write-Through
    ├── Write-Behind
    └── Refresh-Ahead
```

### Cache Flow

```
1. API Request → Check Cache
2. Cache Hit → Return Cached Data
3. Cache Miss → Fetch from Source
4. Store in Cache → Cache the response
5. Return Response → Return to client
6. Background Refresh → Update cache asynchronously
```

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main cache API handler and router

**Key Function**:
```javascript
export async function Cache(env, subpath, method, body)
```

**Routes**:
- `GET /api/cache/:key`: Retrieve cached value
- `POST /api/cache/:key`: Store value in cache
- `DELETE /api/cache/:key`: Remove from cache

### Cache Operations (`get.js`, `set.js`, `delete.js`)

**Purpose**: Core cache operations

**Key Functions**:
```javascript
export async function getFromCache(env, key)
export async function setCache(env, key, value, options)
export async function deleteFromCache(env, key)
```

**Features**:
- Get cached values
- Set values with TTL
- Delete specific keys
- Bulk operations support

### Calculation History Cache (`calcul_history.js`)

**Purpose**: Cache calculation history for performance

**Key Function**:
```javascript
export async function getCachedCalculationHistory(userId, limit)
export async function setCachedCalculationHistory(userId, history)
```

**Features**:
- Cache user calculation history
- Improve history retrieval performance
- Automatic cache invalidation
- TTL-based expiration

---

## 🔌 API Endpoints

### GET `/api/cache/:key`

Retrieve cached value by key.

**Parameters**:
- `key`: Cache key

**Response**:
```json
{
  "success": true,
  "value": "cached_value",
  "key": "cache_key",
  "ttl": 3600
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "key_not_found"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/cache/user_123:grades', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (data.success) {
  console.log(data.value);
}
```

### POST `/api/cache/:key`

Store value in cache.

**Parameters**:
- `key`: Cache key

**Request Body**:
```json
{
  "value": "data_to_cache",
  "ttl": 3600
}
```

**Response**:
```json
{
  "success": true,
  "key": "cache_key",
  "ttl": 3600
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/cache/user_123:grades', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    value: gradesData,
    ttl: 3600
  })
});

const data = await response.json();
```

### DELETE `/api/cache/:key`

Remove value from cache.

**Parameters**:
- `key`: Cache key

**Response**:
```json
{
  "success": true,
  "key": "cache_key"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/cache/user_123:grades', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

---

## 🚀 Caching Strategies

### Cache-Aside (Lazy Loading)

**Pattern**:
1. Check cache for data
2. If cache miss, fetch from source
3. Store in cache for future requests
4. Return data to client

**Implementation**:
```javascript
async function getDataWithCache(key, fetchFunction) {
  // Try cache first
  const cached = await getFromCache(env, key);
  if (cached) {
    return cached;
  }
  
  // Cache miss - fetch from source
  const data = await fetchFunction();
  
  // Store in cache
  await setCache(env, key, data, { ttl: 3600 });
  
  return data;
}
```

### Write-Through

**Pattern**:
1. Write data to cache
2. Write data to source
3. Return success

**Implementation**:
```javascript
async function writeThroughCache(key, data, writeFunction) {
  // Write to cache
  await setCache(env, key, data, { ttl: 3600 });
  
  // Write to source
  await writeFunction(data);
  
  return { success: true };
}
```

### Refresh-Ahead

**Pattern**:
1. Check cache for data
2. If cache hit but nearing expiration, refresh asynchronously
3. Return cached data immediately
4. Update cache in background

**Implementation**:
```javascript
async function getDataWithRefreshAhead(key, fetchFunction) {
  const cached = await getFromCache(env, key);
  
  if (cached) {
    // Check if nearing expiration
    if (cached.ttl < 300) { // Less than 5 minutes
      // Refresh in background
      fetchFunction().then(data => {
        setCache(env, key, data, { ttl: 3600 });
      });
    }
    
    return cached.value;
  }
  
  // Cache miss - fetch immediately
  const data = await fetchFunction();
  await setCache(env, key, data, { ttl: 3600 });
  
  return data;
}
```

---

## 🔑 Cache Key Design

### Key Structure

**Format**: `prefix:identifier:context`

**Examples**:
- `user:123:grades` - User's grades
- `user:123:homeworks` - User's homework
- `session:abc123:data` - Session data
- `calc:456:history` - Calculation history

### Key Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `user` | User-specific data | `user:123:settings` |
| `session` | Session data | `session:abc123:data` |
| `calc` | Calculation data | `calc:456:history` |
| `api` | API responses | `api:external:response` |
| `temp` | Temporary data | `temp:upload:processing` |

### Key Naming Best Practices

- **Descriptive**: Keys should clearly describe their content
- **Consistent**: Use consistent naming conventions
- **Hierarchical**: Use colons to create hierarchy
- **Short**: Keep keys reasonably short for performance
- **Unique**: Ensure keys are unique to avoid conflicts

---

## ⏱️ TTL Management

### TTL Guidelines

**Short TTL (1-5 minutes)**:
- Real-time data
- Frequently changing data
- User-specific session data

**Medium TTL (1-24 hours)**:
- User grades (updated daily)
- Homework assignments
- User settings

**Long TTL (1-7 days)**:
- Static reference data
- Configuration data
- Archive data

### TTL Examples

```javascript
// Real-time data - short TTL
await setCache(env, 'user:123:current_status', status, { ttl: 300 });

// Daily updated data - medium TTL
await setCache(env, 'user:123:grades', grades, { ttl: 86400 });

// Static data - long TTL
await setCache(env, 'config:school_info', schoolInfo, { ttl: 604800 });
```

---

## 🛠️ Development Guidelines

### Cache Operations

**Getting Cached Data**:
```javascript
async function getCachedData(key) {
  try {
    const value = await env.cache.get(key);
    if (value === null) {
      return null; // Cache miss
    }
    return JSON.parse(value);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}
```

**Setting Cached Data**:
```javascript
async function setCachedData(key, value, ttl = 3600) {
  try {
    const serialized = JSON.stringify(value);
    await env.cache.put(key, serialized, {
      expirationTtl: ttl
    });
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}
```

**Deleting Cached Data**:
```javascript
async function deleteCachedData(key) {
  try {
    await env.cache.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}
```

### Cache Invalidation

**Time-Based Invalidation**:
```javascript
// Let TTL handle expiration
await setCache(env, key, value, { ttl: 3600 });
```

**Event-Based Invalidation**:
```javascript
// Invalidate on data update
async function updateUserData(userId, newData) {
  // Update source
  await database.update(userId, newData);
  
  // Invalidate cache
  await deleteFromCache(env, `user:${userId}:data`);
}
```

**Selective Invalidation**:
```javascript
// Invalidate specific keys
async function invalidateUserCache(userId) {
  const patterns = [
    `user:${userId}:grades`,
    `user:${userId}:homeworks`,
    `user:${userId}:settings`
  ];
  
  for (const key of patterns) {
    await deleteFromCache(env, key);
  }
}
```

### Error Handling

**Graceful Degradation**:
```javascript
async function getDataWithCacheFallback(key, fetchFunction) {
  try {
    const cached = await getFromCache(env, key);
    if (cached) return cached;
  } catch (error) {
    console.warn('Cache error, falling back to source:', error);
  }
  
  // Fallback to source
  return await fetchFunction();
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Cache Not Updating**:
- Check TTL settings
- Verify invalidation logic
- Check key consistency
- Review cache update triggers

**High Cache Miss Rate**:
- Review cache key patterns
- Check TTL settings (too short?)
- Monitor cache hit ratio
- Verify cache warming strategy

**Memory Issues**:
- Monitor cache size
- Review TTL settings
- Implement cache eviction
- Check for memory leaks

### Debugging

**Cache Monitoring**:
```javascript
async function monitorCacheHealth() {
  const testKey = 'health_check';
  const testValue = { timestamp: Date.now() };
  
  // Test write
  const writeSuccess = await setCache(env, testKey, testValue, { ttl: 60 });
  
  // Test read
  const readValue = await getFromCache(env, testKey);
  
  // Test delete
  const deleteSuccess = await deleteFromCache(env, testKey);
  
  return {
    write: writeSuccess,
    read: readValue !== null,
    delete: deleteSuccess
  };
}
```

**Performance Monitoring**:
```javascript
const startTime = Date.now();
const cached = await getFromCache(env, key);
const duration = Date.now() - startTime;

if (duration > 100) {
  console.warn(`Slow cache get (${duration}ms):`, key);
}
```

---

## 📚 Additional Resources

- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Caching Best Practices](https://developers.cloudflare.com/cache/how-to/cache-best-practices/)
- [Cache Strategies](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-dynamodb/)

---

## 🚀 Future Enhancements

Planned cache improvements:

- **Smart Caching**: AI-powered cache prediction
- **Distributed Caching**: Multi-region cache coordination
- **Cache Analytics**: Advanced cache performance metrics
- **Auto-scaling**: Dynamic cache size adjustment
- **Compression**: Data compression for cache storage
- **Encryption**: Encrypted cache storage

---

## 📝 Notes

- KV provides eventual consistency
- Cache performance varies by location
- TTL is measured in seconds
- Keys are case-sensitive
- Values are stored as strings
- Cache size is limited per account
- Read operations are highly optimized
- Write operations have slight latency

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>