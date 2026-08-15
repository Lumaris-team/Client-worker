# Notifications Service

This directory contains the notification services for the Lumaris platform, handling email notifications and integration with external notification services.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [Email Notifications](#-email-notifications)
- [Notifier Integration](#notifier-integration)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The notifications service provides comprehensive communication capabilities for the Lumaris platform:

- **Email Notifications**: SMTP-based email delivery for important alerts
- **Notifier Integration**: External notification service for real-time alerts
- **Message Formatting**: Structured message formatting and delivery
- **Error Handling**: Robust error handling and retry logic
- **Template System**: Consistent message templates

### Notification Types

- **Academic Alerts**: New grades, homework reminders, timetable changes
- **System Notifications**: Account updates, security alerts, maintenance notices
- **Engagement Messages**: Weekly summaries, progress reports, recommendations
- **Error Notifications**: System errors, API failures, critical issues

---

## 🏗️ Architecture

### Notification Architecture

```
Notification Service
├── Email Service (mail.js)
│   ├── SMTP Configuration
│   ├── Email Templates
│   ├── Message Formatting
│   └── Delivery Management
└── Notifier Service (notifier.js)
    ├── API Integration
    ├── Message Building
    ├── Header Management
    └── Topic-based Routing
```

### Notification Flow

```
1. Event Trigger → Notification Service
2. Message Formatting → Structure notification content
3. Channel Selection → Choose delivery method
4. Delivery → Send via email or notifier
5. Error Handling → Handle delivery failures
6. Logging → Log notification status
```

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main notifications API handler

**Key Function**:
```javascript
export async function NotificationsFunction(env, subpath, method, body)
```

**Routes**:
- `POST /api/notifications/send`: Send notification
- `GET /api/notifications/history`: Get notification history

### Email Service (`mail.js`)

**Purpose**: SMTP-based email notification delivery

**Key Function**:
```javascript
export async function sendMail(env, body)
```

**Features**:
- SMTP email delivery
- HTML and text email support
- Custom sender information
- Attachment support
- Error handling

**Configuration**:
```javascript
{
  EMAIL: String,           // Sender email address
  SMTP_HOST: String,       // SMTP server host
  SMTP_PORT: Number,       // SMTP server port
  SMTP_PASSWORD: String   // SMTP password
}
```

**Message Options**:
```javascript
{
  fromName: String,        // Custom sender name
  to: String,            // Recipient email
  subject: String,       // Email subject
  text: String,          // Plain text content
  html: String           // HTML content
}
```

### Notifier Service (`notifier.js`)

**Purpose**: External notification service integration

**Key Functions**:
```javascript
export async function sendNotifierMessage(env, body, topic)
export async function readNotifierMessages(env, topic)
```

**Features**:
- Topic-based message routing
- Custom header support
- Structured message formatting
- Message history retrieval
- Priority and tagging support

**Configuration**:
```javascript
{
  NOTIFER_URL: String,      // Notifier service URL
  NOTIFER_TOKEN: String,    // Authentication token
  NOTIFER_TOPIC: String     // Default topic
}
```

**Message Structure**:
```javascript
{
  title: String,           // Message title
  subtitle: String,        // Message subtitle
  message: String,         // Main message content
  priority: String,        // Message priority
  tags: String,           // Comma-separated tags
  click: String,          // Click action URL
  actions: String,        // Action buttons
  markdown: Boolean,      // Enable markdown
  delay: String,          // Delivery delay
  email: String,          // Email override
  icon: String,           // Icon URL
  details: Object         // Additional details
}
```

---

## 📧 Email Notifications

### SMTP Configuration

**Environment Variables**:
```toml
[vars]
EMAIL = "noreply@lumaris.education"
SMTP_HOST = "smtp.example.com"
SMTP_PORT = "587"
SMTP_PASSWORD = "your_smtp_password"
```

### Email Templates

**New Grade Notification**:
```javascript
await sendMail(env, {
  to: user.email,
  subject: "New Grade Posted",
  text: `You received a new grade in ${subject}: ${grade}/${maxGrade}`,
  html: `<h1>New Grade Posted</h1><p>You received a new grade in ${subject}: <strong>${grade}/${maxGrade}</strong></p>`
});
```

**Homework Reminder**:
```javascript
await sendMail(env, {
  to: user.email,
  subject: "Homework Reminder",
  text: `Reminder: ${homework.task} is due on ${homework.dueDate}`,
  html: `<h1>Homework Reminder</h1><p>Don't forget: <strong>${homework.task}</strong> is due on ${homework.dueDate}</p>`
});
```

**System Alert**:
```javascript
await sendMail(env, {
  to: admin.email,
  subject: "System Alert",
  text: `System error: ${error.message}`,
  html: `<h1>System Alert</h1><p>Error: <strong>${error.message}</strong></p>`
});
```

### Email Best Practices

**Subject Lines**:
- Keep under 50 characters
- Be descriptive and actionable
- Include relevant context
- Avoid spam-like language

**Content Structure**:
- Clear hierarchy with headings
- Concise and focused content
- Call-to-action when appropriate
- Mobile-friendly formatting

**Deliverability**:
- Use proper authentication
- Monitor bounce rates
- Implement SPF/DKIM/DMARC
- Respect sending limits

---

## 🔔 Notifier Integration

### Message Formatting

**Basic Message**:
```javascript
await sendNotifierMessage(env, {
  title: "New Grade Posted",
  message: "You received a new grade in Mathematics: 18/20"
});
```

**Advanced Message**:
```javascript
await sendNotifierMessage(env, {
  title: "New Grade Posted",
  subtitle: "Mathematics",
  message: "You received a new grade: 18/20",
  priority: "high",
  tags: "academic,grades,math",
  click: "https://lumaris.education/grades",
  icon: "https://lumaris.education/icons/grade.png",
  details: {
    subject: "Mathematics",
    grade: 18,
    maxGrade: 20,
    date: "2024-01-15"
  }
});
```

### Topic-Based Routing

**Topic Usage**:
```javascript
// Send to default topic
await sendNotifierMessage(env, message);

// Send to specific topic
await sendNotifierMessage(env, message, "academic-alerts");

// Read from specific topic
const messages = await readNotifierMessages(env, "academic-alerts");
```

**Topic Organization**:
- `academic-alerts`: Grades, homework, academic events
- `system-notifications`: System updates, maintenance
- `user-activity`: User engagement, progress updates
- `security-alerts`: Security events, authentication

### Header Management

**Custom Headers**:
```javascript
await sendNotifierMessage(env, {
  title: "Important Update",
  message: "System maintenance scheduled",
  priority: "urgent",
  tags: "system,maintenance",
  headers: {
    "Custom-Header": "value",
    "X-Priority": "1"
  }
});
```

**Supported Headers**:
- `Title`: Message title
- `Priority`: Message priority level
- `Tags`: Comma-separated tags
- `Click`: Click action URL
- `Actions`: Action buttons
- `Markdown`: Enable markdown formatting
- `Delay`: Delivery delay
- `Email`: Email override
- `Attach`: File attachments
- `Icon`: Icon URL
- `Cache`: Cache control

---

## 🔌 API Endpoints

### POST `/api/notifications/send`

Send notification via configured channels.

**Request Body**:
```json
{
  "channel": "email",
  "recipient": "user@example.com",
  "subject": "Notification Subject",
  "message": "Notification content",
  "type": "academic"
}
```

**Response**:
```json
{
  "success": true,
  "channel": "email",
  "messageId": "message_id",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### GET `/api/notifications/history`

Get notification history for user.

**Query Parameters**:
- `limit`: Number of notifications to return
- `offset`: Number of notifications to skip

**Response**:
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "channel": "email",
      "subject": "New Grade Posted",
      "sentAt": "2024-01-15T10:00:00Z",
      "status": "delivered"
    }
  ]
}
```

---

## 🛠️ Development Guidelines

### Adding New Notification Types

1. **Define notification template**
2. **Add formatting logic**
3. **Configure delivery channel**
4. **Add error handling**
5. **Update documentation**
6. **Add tests**

**Example**:
```javascript
async function sendCustomNotification(env, user, data) {
  const message = {
    title: "Custom Notification",
    message: `Custom content: ${data.content}`,
    priority: "normal",
    tags: "custom"
  };
  
  try {
    await sendNotifierMessage(env, message, "custom-topic");
    return { success: true };
  } catch (error) {
    console.error('Notification failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Error Handling

**Email Errors**:
```javascript
try {
  await sendMail(env, mailOptions);
  return { success: true };
} catch (error) {
  if (error.message.includes('SMTP')) {
    return { error: 'smtp_error', message: 'Email delivery failed' };
  } else if (error.message.includes('authentication')) {
    return { error: 'auth_error', message: 'SMTP authentication failed' };
  }
  return { error: 'unknown_error', message: error.message };
}
```

**Notifier Errors**:
```javascript
try {
  await sendNotifierMessage(env, message, topic);
  return { success: true };
} catch (error) {
  if (error.message.includes('NOTIFER_TOKEN')) {
    return { error: 'config_error', message: 'Notifier token missing' };
  } else if (error.message.includes('send failed')) {
    return { error: 'delivery_error', message: 'Message delivery failed' };
  }
  return { error: 'unknown_error', message: error.message };
}
```

### Testing

**Email Testing**:
```javascript
test('sendMail sends email correctly', async () => {
  const result = await sendMail(env, {
    to: 'test@example.com',
    subject: 'Test Subject',
    text: 'Test message'
  });
  
  expect(result).toHaveProperty('accepted');
  expect(result.accepted).toContain('test@example.com');
});
```

**Notifier Testing**:
```javascript
test('sendNotifierMessage formats message correctly', async () => {
  const result = await sendNotifierMessage(env, {
    title: 'Test Title',
    message: 'Test message'
  });
  
  expect(result.ok).toBe(true);
  expect(result.status).toBe(200);
});
```

---

## 🔧 Troubleshooting

### Common Issues

**Email Delivery Failing**:
- Check SMTP configuration
- Verify credentials are correct
- Check network connectivity
- Review SMTP server logs
- Verify email format

**Notifier Integration Issues**:
- Check NOTIFER_TOKEN configuration
- Verify NOTIFER_URL is correct
- Check topic permissions
- Review message formatting
- Check service availability

**Message Formatting Issues**:
- Verify message structure
- Check header formatting
- Review topic configuration
- Validate message content
- Check character encoding

### Debugging

**Email Debugging**:
```javascript
console.log("Email configuration:", {
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  EMAIL: env.EMAIL
});

console.log("Mail options:", mailOptions);
console.log("Send result:", result);
```

**Notifier Debugging**:
```javascript
console.log("Notifier URL:", buildNotifierUrl(env, topic));
console.log("Message body:", body);
console.log("Headers:", buildNotifierHeaders(body));
console.log("Formatted text:", buildNotifierText(body));
```

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Configuration](https://docs.smtp.com/)
- [Email Best Practices](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/best-practices.html)
- [Notifier Service Documentation](https://notifier.service/docs)

---

## 🚀 Future Enhancements

Planned notification improvements:

- **Multi-channel Support**: SMS, push notifications, in-app alerts
- **Template System**: Advanced email and message templates
- **Scheduling**: Scheduled notification delivery
- **Analytics**: Notification open rates and engagement
- **A/B Testing**: Test different message formats
- **User Preferences**: User-controlled notification settings

---

## 📝 Notes

- Email notifications require SMTP configuration
- Notifier service requires API token
- Messages are formatted automatically
- Error handling ensures graceful degradation
- Delivery status is tracked
- Privacy is maintained in message content
- Rate limiting prevents spam

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>