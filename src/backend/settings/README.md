# Settings Service

This directory contains the settings management services for the Lumaris platform, handling user customization preferences and usage statistics.

## 📋 Table of Contents

- [Overview](#-overview)
- [Available Modules](#-available-modules)
- [API Endpoints](#-api-endpoints)
- [Data Models](#-data-models)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The settings service provides comprehensive user preference management and platform statistics:

- **User Customization**: Theme, fonts, colors, and interface preferences
- **Usage Statistics**: Platform usage analytics and metrics
- **Preference Storage**: Persistent user settings
- **Statistics Tracking**: User activity and engagement metrics

### Settings Categories

- **Visual Settings**: Theme, colors, fonts, sizes
- **Functional Settings**: Notifications, language, accessibility
- **Privacy Settings**: Data sharing, analytics preferences
- **Account Settings**: Profile, security, connected accounts

---

## 📦 Available Modules

### Statistics Module (`stats.js`)

**Purpose**: Track and report platform usage statistics

**Key Function**:
```javascript
export async function StatsFunction(env)
```

**Features**:
- User activity tracking
- Feature usage statistics
- Performance metrics
- Engagement analytics
- System health monitoring

**Response Structure**:
```javascript
{
  totalUsers: Number,
  activeUsers: Number,
  totalSessions: Number,
  averageSessionDuration: Number,
  featureUsage: {
    ai: Number,
    files: Number,
    notes: Number,
    tools: Number
  },
  systemHealth: {
    uptime: Number,
    errorRate: Number,
    responseTime: Number
  }
}
```

### Customization Module (`customization.js`)

**Purpose**: Manage user customization settings

**Key Function**:
```javascript
export async function CustomizationFunction(env, subpath, method, body, session)
```

**Features**:
- Theme management (dark/light)
- Color customization
- Font selection and sizing
- Layout preferences
- Accessibility settings

**Data Model**:
```javascript
{
  background_type: String,          // "gradient" or "solid"
  background_gradient_style: String, // "linear" or "radial"
  background_gradient_orientation: String, // CSS angle
  background_color_1: String,       // Primary color
  background_color_2: String,       // Secondary color
  background_solid_color: String,   // Solid background color
  background_font_family: String,   // Font family
  background_font_weight: String,   // Font weight
  background_font_size: Number       // Font size in pixels
}
```

---

## 🔌 API Endpoints

### GET `/api/settings/stats`

Get platform usage statistics.

**Response**:
```json
{
  "totalUsers": 1250,
  "activeUsers": 450,
  "totalSessions": 15000,
  "averageSessionDuration": 1800,
  "featureUsage": {
    "ai": 3200,
    "files": 2800,
    "notes": 4100,
    "tools": 1900
  },
  "systemHealth": {
    "uptime": 99.9,
    "errorRate": 0.1,
    "responseTime": 150
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/settings/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
console.log('Active users:', stats.activeUsers);
```

### GET `/api/settings/customization`

Get user customization settings.

**Response**:
```json
{
  "settings": {
    "background_type": "gradient",
    "background_gradient_style": "linear",
    "background_gradient_orientation": "135deg",
    "background_color_1": "#0b3f91",
    "background_color_2": "#1c8cff",
    "background_solid_color": "#08100f",
    "background_font_family": "Inter, ui-sans-serif, system-ui, sans-serif",
    "background_font_weight": "500",
    "background_font_size": 16
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/settings/customization', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const settings = data.settings;
```

### PUT `/api/settings/customization`

Update user customization settings.

**Request Body**:
```json
{
  "settings": {
    "background_type": "solid",
    "background_solid_color": "#1a1a1a",
    "background_font_size": 18
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": {
    "background_type": "solid",
    "background_solid_color": "#1a1a1a",
    "background_font_size": 18,
    "background_gradient_style": "linear",
    "background_gradient_orientation": "135deg",
    "background_color_1": "#0b3f91",
    "background_color_2": "#1c8cff",
    "background_font_family": "Inter, ui-sans-serif, system-ui, sans-serif",
    "background_font_weight": "500"
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/settings/customization', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    settings: {
      background_type: 'solid',
      background_solid_color: '#1a1a1a',
      background_font_size: 18
    }
  })
});

const data = await response.json();
```

---

## 🎨 Customization Options

### Background Settings

**Background Types**:
- `gradient`: Gradient background
- `solid`: Solid color background

**Gradient Styles**:
- `linear`: Linear gradient
- `radial`: Radial gradient

**Gradient Orientations**:
- `0deg`, `45deg`, `90deg`, `135deg`, `180deg`, `225deg`, `270deg`, `315deg`

**Color Options**:
- Primary color: Main accent color
- Secondary color: Secondary accent color
- Solid color: Background color for solid type

### Typography Settings

**Font Families**:
- `system-ui`: System default fonts
- `Inter`: Inter font family
- `IBM Plex Sans`: IBM Plex Sans font
- `Poppins`: Poppins font family
- `JetBrains Mono`: Monospace font
- `Lora`: Serif font

**Font Weights**:
- `400`: Regular
- `500`: Medium
- `600`: Semi-bold
- `700`: Bold
- `800`: Extra-bold

**Font Sizes**:
- Range: 14px to 28px
- Default: 16px

---

## 📊 Statistics Tracking

### Metrics Collected

**User Metrics**:
- Total registered users
- Active users (last 30 days)
- New user registrations
- User retention rates

**Session Metrics**:
- Total sessions
- Average session duration
- Peak concurrent sessions
- Session frequency

**Feature Usage**:
- AI chat usage count
- File operations count
- Note creation count
- Tool usage count

**System Health**:
- Platform uptime percentage
- Error rate
- Average response time
- Resource utilization

### Data Privacy

**Statistics Privacy**:
- No personally identifiable information
- Aggregated data only
- No individual user tracking
- Anonymous usage metrics
- Opt-out available

---

## 🛠️ Development Guidelines

### Adding New Settings

1. **Add setting to database schema**
2. **Update data model**
3. **Add validation logic**
4. **Update API endpoints**
5. **Add frontend UI**
6. **Update documentation**

**Example**:
```javascript
// Add new setting to validation
const VALID_SETTINGS = {
  // ... existing settings
  new_setting: (value) => typeof value === 'string' && value.length <= 100
};

// Update normalization
function normalizeSettings(settings) {
  return {
    // ... existing settings
    new_setting: VALID_SETTINGS.new_setting(settings.new_setting) 
      ? settings.new_setting 
      : defaultSettings.new_setting
  };
}
```

### Settings Validation

**Input Validation**:
```javascript
function validateSettings(settings) {
  const errors = [];
  
  if (!['gradient', 'solid'].includes(settings.background_type)) {
    errors.push('Invalid background type');
  }
  
  if (!isValidColor(settings.background_color_1)) {
    errors.push('Invalid primary color');
  }
  
  if (settings.background_font_size < 14 || settings.background_font_size > 28) {
    errors.push('Font size must be between 14 and 28');
  }
  
  return errors;
}
```

**Color Validation**:
```javascript
function isValidColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
```

### Statistics Collection

**Event Tracking**:
```javascript
async function trackFeatureUsage(userId, feature) {
  await env.customization.prepare(`
    INSERT INTO feature_usage (user_id, feature, timestamp)
    VALUES (?, ?, ?)
  `).bind(userId, feature, new Date().toISOString()).run();
}
```

**Aggregation Queries**:
```javascript
async function getFeatureStats(env) {
  const result = await env.customization.prepare(`
    SELECT feature, COUNT(*) as usage_count
    FROM feature_usage
    WHERE timestamp > datetime('now', '-30 days')
    GROUP BY feature
  `).all();
  
  return result.map(row => ({
    feature: row.feature,
    count: row.usage_count
  }));
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Settings Not Saving**:
- Check database connection
- Verify user authentication
- Validate settings data
- Check database permissions

**Statistics Not Updating**:
- Verify tracking functions are called
- Check database write operations
- Review aggregation queries
- Monitor system logs

**Customization Not Applying**:
- Check frontend implementation
- Verify CSS custom properties
- Review settings retrieval
- Check for caching issues

### Debugging

**Settings Debugging**:
```javascript
console.log("Settings request:", { method, body, session });
console.log("Settings validation:", validateSettings(body.settings));
console.log("Database operation:", dbResult);
```

**Statistics Debugging**:
```javascript
console.log("Stats query:", query);
console.log("Stats result:", result);
console.log("Aggregation time:", duration);
```

---

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Web Color Standards](https://www.w3.org/TR/css-color/)
- [Typography Best Practices](https://web.dev/responsive-typography/)
- [Privacy by Design](https://en.wikipedia.org/wiki/Privacy_by_design)

---

## 🚀 Future Enhancements

Planned settings improvements:

- **Advanced Themes**: More theme options and presets
- **User Profiles**: Enhanced profile customization
- **Accessibility**: More accessibility options
- **Export/Import**: Settings backup and restore
- **A/B Testing**: Settings for feature testing
- **Analytics Dashboard**: User analytics dashboard

---

## 📝 Notes

- Settings are stored per user
- Statistics are aggregated and anonymized
- Settings validation ensures data integrity
- Frontend and backend settings are synchronized
- Performance monitoring is continuous
- Privacy is prioritized in statistics collection

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>