# Tools Service

This directory contains utility tools and productivity functions for the Lumaris platform, providing various helper functions and converters for student productivity.

## 📋 Table of Contents

- [Overview](#-overview)
- [Available Modules](#-available-modules)
- [API Endpoints](#-api-endpoints)
- [Tool Categories](#-tool-categories)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The tools service provides a collection of utility functions and productivity tools designed to enhance the student experience:

- **Data Converters**: Unit converters and data transformation tools
- **Calculation History**: Track and manage calculation history
- **Productivity Utilities**: Helper functions for common tasks
- **Academic Tools**: Specialized tools for academic work

### Tool Categories

- **Conversion Tools**: Unit conversion, data format conversion
- **Calculation Tools**: Mathematical operations and history
- **Productivity Tools**: Time management, organization helpers
- **Academic Tools**: Grade calculators, GPA tools

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main tools API handler and router

**Key Function**:
```javascript
export async function ToolsFunction(env, subpath, method, body)
```

**Routes**:
- `POST /api/tools/convert`: Unit conversion
- `POST /api/tools/calculate`: Mathematical calculations
- `GET /api/tools/history`: Calculation history
- `DELETE /api/tools/history`: Clear history

### Converter Module (`converter.js`)

**Purpose**: Data and unit conversion utilities

**Key Functions**:
```javascript
export async function convertUnits(value, fromUnit, toUnit)
export async function convertDataFormat(data, fromFormat, toFormat)
```

**Supported Conversions**:
- **Length**: meters, kilometers, miles, feet, inches
- **Weight**: kilograms, grams, pounds, ounces
- **Temperature**: Celsius, Fahrenheit, Kelvin
- **Time**: seconds, minutes, hours, days
- **Data**: bytes, kilobytes, megabytes, gigabytes

**Usage Example**:
```javascript
const result = await convertUnits(100, 'meters', 'kilometers');
// Returns: 0.1
```

### Calculation History Module (`calcul_history.js`)

**Purpose**: Track and manage calculation history

**Key Functions**:
```javascript
export async function getCalculationHistory(userId, limit)
export async function addCalculation(userId, calculation, result)
export async function clearCalculationHistory(userId)
```

**Features**:
- Store calculation history
- Retrieve recent calculations
- Clear history on demand
- Categorize by calculation type

**Data Model**:
```javascript
{
  id: Number,
  user_id: String,
  calculation: String,      // Calculation expression
  result: String,           // Calculation result
  type: String,            // Calculation type
  timestamp: String        // ISO timestamp
}
```

---

## 🔌 API Endpoints

### POST `/api/tools/convert`

Convert units or data formats.

**Request Body**:
```json
{
  "value": 100,
  "fromUnit": "meters",
  "toUnit": "kilometers"
}
```

**Response**:
```json
{
  "success": true,
  "result": 0.1,
  "original": 100,
  "fromUnit": "meters",
  "toUnit": "kilometers"
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/tools/convert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    value: 100,
    fromUnit: 'meters',
    toUnit: 'kilometers'
  })
});

const data = await response.json();
console.log(data.result); // 0.1
```

### POST `/api/tools/calculate`

Perform mathematical calculations.

**Request Body**:
```json
{
  "expression": "2 + 2 * 3",
  "type": "basic"
}
```

**Response**:
```json
{
  "success": true,
  "result": 8,
  "expression": "2 + 2 * 3",
  "steps": ["2 + (2 * 3)", "2 + 6", "8"]
}
```

### GET `/api/tools/history`

Get calculation history for user.

**Query Parameters**:
- `limit`: Number of entries to return (default: 20)

**Response**:
```json
{
  "history": [
    {
      "id": 1,
      "calculation": "2 + 2",
      "result": "4",
      "type": "basic",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### DELETE `/api/tools/history`

Clear calculation history.

**Response**:
```json
{
  "success": true,
  "message": "History cleared"
}
```

---

## 🛠️ Tool Categories

### Conversion Tools

**Length Conversion**:
```javascript
convertUnits(1, 'kilometers', 'meters') // 1000
convertUnits(1000, 'meters', 'kilometers') // 1
convertUnits(1, 'miles', 'kilometers') // 1.60934
```

**Weight Conversion**:
```javascript
convertUnits(1, 'kilograms', 'grams') // 1000
convertUnits(1000, 'grams', 'kilograms') // 1
convertUnits(1, 'pounds', 'kilograms') // 0.453592
```

**Temperature Conversion**:
```javascript
convertUnits(0, 'celsius', 'fahrenheit') // 32
convertUnits(32, 'fahrenheit', 'celsius') // 0
convertUnits(0, 'celsius', 'kelvin') // 273.15
```

**Data Conversion**:
```javascript
convertUnits(1024, 'bytes', 'kilobytes') // 1
convertUnits(1, 'megabytes', 'kilobytes') // 1024
convertUnits(1, 'gigabytes', 'megabytes') // 1024
```

### Calculation Tools

**Basic Operations**:
```javascript
calculate("2 + 2") // 4
calculate("10 - 3") // 7
calculate("5 * 6") // 30
calculate("20 / 4") // 5
```

**Advanced Operations**:
```javascript
calculate("2^3") // 8
calculate("sqrt(16)") // 4
calculate("sin(0)") // 0
calculate("log(100)") // 2
```

---

## 🛠️ Development Guidelines

### Adding New Tools

1. **Create tool module** in `tools/` directory
2. **Implement tool logic**
3. **Add route to main handler**
4. **Add error handling**
5. **Update documentation**
6. **Add tests**

**Example**:
```javascript
// tools/new_tool.js
export async function newToolOperation(params) {
  // Implementation
  return { result: "tool result" };
}

// tools/index.js
import { newToolOperation } from "./new_tool.js";

if (subpath === "new-tool" && method === "POST") {
  const result = await newToolOperation(body);
  return result;
}
```

### Error Handling

**Validation Errors**:
```javascript
if (!value || isNaN(value)) {
  return { error: 'invalid_value', message: 'Value must be a number' };
}

if (!SUPPORTED_UNITS.includes(fromUnit)) {
  return { error: 'unsupported_unit', message: 'Unit not supported' };
}
```

**Calculation Errors**:
```javascript
try {
  const result = evaluateExpression(expression);
  return { success: true, result };
} catch (error) {
  return { error: 'calculation_error', message: error.message };
}
```

### Performance Optimization

**Caching**:
```javascript
const conversionCache = new Map();

function getCachedConversion(key) {
  if (conversionCache.has(key)) {
    return conversionCache.get(key);
  }
  return null;
}

function setCachedConversion(key, value) {
  conversionCache.set(key, value);
}
```

**Batch Operations**:
```javascript
async function batchConversions(conversions) {
  return Promise.all(
    conversions.map(conv => convertUnits(conv.value, conv.from, conv.to))
  );
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Conversion Failing**:
- Check unit spelling and case
- Verify conversion is supported
- Check value type (must be number)
- Review conversion factors

**Calculation Errors**:
- Check expression syntax
- Verify mathematical operators
- Check for division by zero
- Review function names

**History Issues**:
- Check user authentication
- Verify database connection
- Check storage limits
- Review data format

### Debugging

**Enable Detailed Logging**:
```javascript
console.log("Tool request:", { subpath, method, body });
console.log("Tool result:", result);
console.log("Execution time:", duration);
```

**Monitor Tool Usage**:
```javascript
const startTime = Date.now();
const result = await toolOperation(params);
const duration = Date.now() - startTime;

console.log(`Tool operation took ${duration}ms`);
```

---

## 📚 Additional Resources

- [Unit Conversion Standards](https://www.nist.gov/pml/owm/metric-si)
- [Mathematical Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math)
- [JavaScript Number Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

---

## 🚀 Future Enhancements

Planned tool improvements:

- **Advanced Converters**: More unit types and conversions
- **Scientific Calculator**: Advanced mathematical functions
- **Graphing Tools**: Visual representation of data
- **Equation Solver**: Solve complex equations
- **Statistical Tools**: Statistical analysis functions
- **Custom Tools**: User-defined tools and converters

---

## 📝 Notes

- Tools are designed for educational use
- All calculations are performed server-side
- History is stored per user
- Conversion factors are based on international standards
- Error handling ensures graceful degradation
- Performance is optimized for frequent operations

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>