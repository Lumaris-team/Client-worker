# ÉcoleDirecte Integration Service

This directory contains the integration with the French school system ÉcoleDirecte, providing access to student grades, homework, timetables, and academic information.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [API Endpoints](#-api-endpoints)
- [Data Models](#-data-models)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The ÉcoleDirecte integration service provides seamless access to the French school system's data, enabling students to:

- **View Grades**: Access current and historical grades
- **Track Homework**: Monitor homework assignments and deadlines
- **Check Timetables**: View class schedules and important dates
- **Monitor Averages**: Calculate and track grade averages
- **Receive Notifications**: Get alerts for new grades and homework

### Integration Features

- **Real-time Data**: Live access to student information
- **Cached Responses**: Optimized performance with caching
- **Filtering Options**: Filter data by subject, period, etc.
- **New Content Detection**: Identify new grades and homework
- **Error Resilience**: Graceful handling of API failures

---

## 🏗️ Architecture

### Service Architecture

```
ÉcoleDirecte Service (index.js)
├── Information Module (informations.js)
│   ├── Student information
│   ├── Class details
│   └── School information
├── Grades Module (grades.js)
│   ├── Grade retrieval
│   ├── Average calculation
│   └── New grade detection
├── Homework Module (homeworks.js)
│   ├── Homework retrieval
│   ├── Homework completion
│   └── Deadline tracking
└── Timetable Module (timetable.js)
    ├── Schedule retrieval
    ├── Event tracking
    └── Date filtering
```

### Data Flow

```
1. API Request → ÉcoleDirecte Service
2. Authentication → Token validation/renewal
3. API Call → ÉcoleDirecte API
4. Data Processing → Parse and format data
5. Filtering → Apply user filters
6. Caching → Store frequently accessed data
7. Response → Return formatted data
```

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main ÉcoleDirecte API handler and router

**Key Function**:
```javascript
export async function EDfunction(env, subpath, method, headers, body)
```

**Routes**:
- `GET /api/ed/info`: Get student information
- `GET /api/ed/grades`: Get student grades
- `GET /api/ed/averages`: Get grade averages
- `GET /api/ed/new-grades`: Get new grades since last check
- `GET /api/ed/homeworks`: Get homework assignments
- `POST /api/ed/homeworks`: Mark homework as done
- `GET /api/ed/timetable`: Get student timetable

**Headers**:
- `filter`: "true" to apply filtering
- `new_token`: "true" to force token refresh

### Information Module (`informations.js`)

**Purpose**: Retrieve student and school information

**Key Function**:
```javascript
export async function EDinformations(env, newToken)
```

**Data Retrieved**:
- Student personal information
- Class details and schedule
- School information
- Academic year details
- Teacher information

**Response Structure**:
```javascript
{
  student: {
    id: "student_id",
    name: "Student Name",
    firstName: "First Name",
    class: "Class Name",
    school: "School Name"
  },
  class: {
    id: "class_id",
    name: "Class Name",
    level: "Grade Level",
    year: "2023-2024"
  },
  school: {
    id: "school_id",
    name: "School Name",
    address: "School Address",
    phone: "School Phone"
  }
}
```

### Grades Module (`grades.js`)

**Purpose**: Handle grade-related operations

**Key Functions**:
```javascript
export async function EDgrades(env, informations, filter)
export async function EDaverages(gradesData)
export async function EDnewgrades(gradesData)
```

**Features**:
- Grade retrieval by subject and period
- Average calculation by subject and overall
- New grade detection since last check
- Grade filtering and sorting
- Statistical analysis

**Response Structure**:
```javascript
{
  grades: {
    "period1": {
      "Mathematics": [
        {
          id: "grade_id",
          grade: 18.5,
          coefficient: 2,
          date: "2024-01-15",
          teacher: "Teacher Name",
          subject: "Mathematics",
          comment: "Grade comment"
        }
      ],
      "French": [...]
    },
    "period2": {...}
  },
  averages: {
    "period1": {
      "Mathematics": 16.5,
      "French": 15.0,
      "overall": 15.75
    }
  }
}
```

### Homework Module (`homeworks.js`)

**Purpose**: Manage homework assignments

**Key Functions**:
```javascript
export async function EDhomeworks(env, informations, filter)
export async function EDhomeworksDone(env, informations, homeworkId, done)
```

**Features**:
- Homework retrieval by subject and date
- Homework completion tracking
- Deadline reminders
- Subject filtering
- Priority classification

**Response Structure**:
```javascript
{
  homeworks: [
    {
      id: "homework_id",
      subject: "Mathematics",
      task: "Complete exercises 1-10",
      dueDate: "2024-01-20",
      assignedDate: "2024-01-15",
      teacher: "Teacher Name",
      done: false,
      priority: "high"
    }
  ]
}
```

### Timetable Module (`timetable.js`)

**Purpose**: Retrieve and manage student timetables

**Key Function**:
```javascript
export async function EDtimetable(env, informations, filter)
```

**Features**:
- Weekly schedule retrieval
- Special event tracking
- Holiday detection
- Subject filtering
- Time-based filtering

**Response Structure**:
```javascript
{
  timetable: {
    "monday": [
      {
        subject: "Mathematics",
        teacher: "Teacher Name",
        room: "Room 101",
        startTime: "08:00",
        endTime: "09:00",
        type: "regular"
      }
    ],
    "tuesday": [...]
  },
  events: [
    {
      date: "2024-01-20",
      type: "exam",
      subject: "Mathematics",
      description: "Mid-term exam"
    }
  ]
}
```

---

## 🔌 API Endpoints

### GET `/api/ed/info`

Get student and school information.

**Headers**:
```
new_token: true/false
```

**Response**:
```json
{
  "student": {
    "id": "student_id",
    "name": "Student Name",
    "firstName": "First Name",
    "class": "3A",
    "school": "Lycée Example"
  },
  "class": {
    "id": "class_id",
    "name": "3A",
    "level": "Troisième",
    "year": "2023-2024"
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/info?new_token=false', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.student.name);
```

### GET `/api/ed/grades`

Get student grades with optional filtering.

**Headers**:
```
filter: true/false
new_token: true/false
```

**Response**:
```json
{
  "grades": {
    "Trimestre 1": {
      "Mathématiques": [
        {
          "id": "12345",
          "note": 18.5,
          "noteSur": 20,
          "coefficient": 2,
          "date": "2024-01-15",
          "professeur": "M. Dupont",
          "commentaire": "Excellent travail"
        }
      ]
    }
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/grades?filter=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const mathGrades = data.grades["Trimestre 1"]["Mathématiques"];
```

### GET `/api/ed/averages`

Get grade averages by subject and overall.

**Response**:
```json
{
  "averages": {
    "Trimestre 1": {
      "Mathématiques": 16.5,
      "Français": 15.0,
      "Histoire": 14.5,
      "overall": 15.33
    },
    "Trimestre 2": {
      "Mathématiques": 17.0,
      "Français": 15.5,
      "Histoire": 15.0,
      "overall": 15.83
    }
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/averages', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const overallAverage = data.averages["Trimestre 1"].overall;
```

### GET `/api/ed/new-grades`

Get new grades since last check.

**Headers**:
```
filter: true/false
```

**Response**:
```json
{
  "newGrades": {
    "Trimestre 1": {
      "Mathématiques": [
        {
          "id": "12346",
          "note": 17.0,
          "noteSur": 20,
          "coefficient": 2,
          "date": "2024-01-18"
        }
      ]
    }
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/new-grades?filter=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
// Process new grades and send notifications
```

### GET `/api/ed/homeworks`

Get homework assignments.

**Headers**:
```
filter: true/false
new_token: true/false
```

**Response**:
```json
{
  "homeworks": [
    {
      "id": "67890",
      "matiere": "Mathématiques",
      "contenu": "Exercices 1-10 page 45",
      "dateDonnee": "2024-01-15",
      "datePour": "2024-01-20",
      "professeur": "M. Dupont",
      "fait": false,
      "priorite": "haute"
    }
  ]
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/homeworks?filter=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const pendingHomework = data.homeworks.filter(hw => !hw.fait);
```

### POST `/api/ed/homeworks`

Mark homework as done/not done.

**Request Body**:
```json
{
  "id": "67890",
  "done": "true"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Homework marked as done"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/homeworks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: '67890',
    done: 'true'
  })
});

const result = await response.json();
```

### GET `/api/ed/timetable`

Get student timetable.

**Headers**:
```
filter: true/false
new_token: true/false
```

**Response**:
```json
{
  "timetable": {
    "Lundi": [
      {
        "matiere": "Mathématiques",
        "professeur": "M. Dupont",
        "salle": "101",
        "heureDebut": "08:00",
        "heureFin": "09:00",
        "type": "cours"
      }
    ],
    "Mardi": [...]
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ed/timetable?filter=true', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
const mondaySchedule = data.timetable["Lundi"];
```

---

## 📊 Data Models

### Grade Model

```javascript
{
  id: String,              // Unique grade identifier
  note: Number,            // Grade value
  noteSur: Number,         // Maximum possible grade
  coefficient: Number,     // Grade coefficient
  date: String,           // Grade date (ISO format)
  professeur: String,      // Teacher name
  matiere: String,        // Subject name
  commentaire: String,    // Teacher comments
  periode: String         // Academic period
}
```

### Homework Model

```javascript
{
  id: String,              // Unique homework identifier
  matiere: String,        // Subject name
  contenu: String,        // Homework description
  dateDonnee: String,     // Assignment date (ISO format)
  datePour: String,       // Due date (ISO format)
  professeur: String,     // Teacher name
  fait: Boolean,          // Completion status
  priorite: String        // Priority level
}
```

### Timetable Entry Model

```javascript
{
  matiere: String,        // Subject name
  professeur: String,     // Teacher name
  salle: String,         // Room number
  heureDebut: String,    // Start time (HH:MM format)
  heureFin: String,      // End time (HH:MM format)
  type: String,          // Entry type (cours, TD, TP, etc.)
  jour: String           // Day of week
}
```

---

## 🔐 Authentication

### Token Management

The ÉcoleDirecte integration uses token-based authentication:

**Token Storage**:
- Tokens are stored securely in the database
- Tokens are associated with user accounts
- Tokens are refreshed automatically when expired

**Token Refresh**:
```javascript
if (newToken || isTokenExpired(token)) {
  token = await refreshToken();
  storeToken(token);
}
```

### Authentication Flow

```
1. User Login → Store ÉcoleDirecte credentials
2. Token Request → Request authentication token
3. Token Storage → Store token securely
4. API Calls → Use token for API requests
5. Token Refresh → Refresh expired tokens
6. Error Handling → Handle authentication failures
```

---

## ⚠️ Error Handling

### Common Errors

**Authentication Errors**:
```javascript
{
  error: "authentication_failed",
  message: "Invalid credentials or expired token"
}
```

**API Errors**:
```javascript
{
  error: "api_error",
  message: "ÉcoleDirecte API unavailable",
  code: "SERVICE_UNAVAILABLE"
}
```

**Data Errors**:
```javascript
{
  error: "data_error",
  message: "Invalid data format received",
  details: "Expected grade object, got null"
}
```

### Error Handling Strategy

```javascript
try {
  const data = await EDfunction(env, subpath, method, headers, body);
  return data;
} catch (error) {
  console.error('ÉcoleDirecte error:', error);
  
  if (error.message.includes('authentication')) {
    return { error: 'authentication_failed' };
  } else if (error.message.includes('network')) {
    return { error: 'network_error' };
  }
  
  return { error: 'unknown_error' };
}
```

---

## 🛠️ Development Guidelines

### Adding New ÉcoleDirecte Features

1. **Create new module** in `ecole_directe/` directory
2. **Implement API integration**
3. **Add data parsing logic**
4. **Add route to main handler**
5. **Update documentation**
6. **Add tests**

**Example**:
```javascript
// ecole_directe/attendance.js
export async function EDattendance(env, informations, filter) {
  // Implementation
  return { attendance: attendanceData };
}

// ecole_directe/index.js
import { EDattendance } from "./attendance.js";

if (subpath === "attendance" && method === "GET") {
  return await EDattendance(env, informations, filter);
}
```

### Data Processing Best Practices

**Normalization**:
```javascript
function normalizeGrade(grade) {
  return {
    id: grade.id,
    note: parseFloat(grade.note),
    noteSur: parseFloat(grade.noteSur) || 20,
    coefficient: parseFloat(grade.coefficient) || 1,
    date: new Date(grade.date).toISOString(),
    professeur: grade.professeur || "Unknown",
    matiere: grade.matiere || "Unknown"
  };
}
```

**Filtering**:
```javascript
function filterGrades(grades, filters) {
  return grades.filter(grade => {
    if (filters.subject && grade.matiere !== filters.subject) return false;
    if (filters.period && grade.periode !== filters.period) return false;
    if (filters.minGrade && grade.note < filters.minGrade) return false;
    return true;
  });
}
```

**Caching**:
```javascript
async function getCachedData(key, ttl) {
  const cached = await env.CACHE.get(key);
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < ttl) {
      return data.value;
    }
  }
  return null;
}

async function setCachedData(key, value) {
  await env.CACHE.put(key, JSON.stringify({
    value,
    timestamp: Date.now()
  }));
}
```

### Testing

**Unit Testing**:
```javascript
test('EDgrades returns correct format', async () => {
  const grades = await EDgrades(env, informations, false);
  expect(grades).toHaveProperty('grades');
  expect(Array.isArray(grades.grades["Trimestre 1"]["Mathématiques"])).toBe(true);
});
```

**Integration Testing**:
```javascript
test('Full grade retrieval flow', async () => {
  const informations = await EDinformations(env, false);
  const grades = await EDgrades(env, informations, true);
  const averages = await EDaverages(grades);
  
  expect(averages.averages).toBeDefined();
});
```

---

## 🔧 Troubleshooting

### Common Issues

**Authentication Failing**:
- Verify credentials are correct
- Check token expiration
- Verify ÉcoleDirecte API access
- Check network connectivity

**Data Not Loading**:
- Check API response format
- Verify data parsing logic
- Check filtering parameters
- Review error logs

**Incorrect Averages**:
- Verify coefficient calculations
- Check grade normalization
- Review averaging logic
- Validate data input

### Debugging

**Enable Detailed Logging**:
```javascript
console.log("ÉcoleDirecte Request:", { subpath, method, headers });
console.log("API Response:", apiResponse);
console.log("Processed Data:", processedData);
```

**Monitor API Calls**:
```javascript
const startTime = Date.now();
const response = await ecoleDirecteAPI.call();
const duration = Date.now() - startTime;

console.log(`ÉcoleDirecte API call took ${duration}ms`);
```

---

## 📚 Additional Resources

- [ÉcoleDirecte API Documentation](https://api.ecoledirecte.com/)
- [French Education System](https://www.education.gouv.fr/)
- [Student Data Privacy](https://www.cnil.fr/)
- [GDPR Compliance](https://gdpr.eu/)

---

## 🚀 Future Enhancements

Planned ÉcoleDirecte improvements:

- **Attendance Tracking**: Monitor attendance records
- **Exam Schedule**: Detailed exam calendar
- **Teacher Messages**: Communication with teachers
- **Document Access**: Access to school documents
- **Parent Portal**: Parent access to student data
- **Multi-school Support**: Support for multiple schools

---

## 📝 Notes

- ÉcoleDirecte integration requires valid credentials
- Data is cached to improve performance
- Filtering options help manage large datasets
- New content detection enables notifications
- Error handling ensures service reliability
- Privacy regulations are strictly followed

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>