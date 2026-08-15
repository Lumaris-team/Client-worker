# AI Service

This directory contains the AI-powered features for the Lumaris platform, integrating with Cloudflare Workers AI to provide intelligent tutoring, web search, image analysis, and advanced reasoning capabilities.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Available Modules](#-available-modules)
- [AI Categories](#ai-categories)
- [API Endpoints](#-api-endpoints)
- [Model Management](#-model-management)
- [Usage Tracking](#-usage-tracking)
- [Development Guidelines](#-development-guidelines)

---

## 🎯 Overview

The AI service provides a comprehensive AI interface using Cloudflare Workers AI, offering multiple categories of AI models for different use cases:

- **Basic AI**: General-purpose chat and assistance
- **Pictures**: Image generation and analysis
- **Reasoning**: Advanced reasoning and complex problem solving
- **Web Search**: AI with web search capabilities
- **Notes & Remarks**: Academic note analysis and feedback

### Key Features

- **Multiple AI Categories**: Specialized models for different tasks
- **Model Selection**: Dynamic model selection based on use case
- **Usage Tracking**: Monitor AI usage and limits
- **Conversation Management**: Maintain conversation context
- **Web Integration**: Real-time web search capabilities
- **Image Processing**: AI-powered image analysis and generation

---

## 🏗️ Architecture

### Service Architecture

```
AI Service (index.js)
├── Model Management
│   ├── Fetch models from Cloudflare API
│   ├── Categorize models by capability
│   ├── Estimate consumption
│   └── Model selection logic
├── Category Handlers
│   ├── Basic (basic.js)
│   ├── Pictures (pictures.js)
│   ├── Reasoning (reasonning.js)
│   ├── Web Search (search_web.js)
│   └── Notes Remarks (notes_remarks.js)
├── Conversation Management
│   ├── Gateway logs (gateway_logs.js)
│   ├── Gateway metadata (gateway_metadata.js)
│   └── Conversation history
└── Usage Tracking
    ├── Limits (limits.js)
    ├── Usage statistics
    └── Rate limiting
```

### Request Flow

```
1. Client Request → AI Service
2. Category Selection → Choose appropriate AI category
3. Model Selection → Select best model for task
4. AI Processing → Execute AI model
5. Response Generation → Format AI response
6. Usage Tracking → Record usage statistics
7. Conversation Storage → Store conversation history
8. Response Delivery → Return result to client
```

---

## 📦 Available Modules

### Main Handler (`index.js`)

**Purpose**: Main AI API handler and router

**Key Function**:
```javascript
export async function AIfunction(env, subpath, method, headers, body, request)
```

**Routes**:
- `GET /api/ai/categories`: Get available AI models and categories
- `POST /api/ai/chat`: Unified AI chat interface
- `GET /api/ai/conversations`: List conversations
- `GET /api/ai/conversations/:id`: Get specific conversation
- `DELETE /api/ai/conversations/:id`: Delete conversation
- `GET /api/ai/limits`: Get AI usage limits

**Features**:
- Model categorization and filtering
- Consumption estimation
- Category alias mapping
- Frontend-backend name translation

### Basic AI (`basic.js`)

**Purpose**: General-purpose AI chat functionality

**Key Function**:
```javascript
export async function basic(env, model, params)
```

**Use Cases**:
- General chat and conversation
- Question answering
- Text generation
- Summarization
- Translation

**Model Types**:
- Text generation models
- Chat-optimized models
- Lightweight models for fast responses

### Pictures AI (`pictures.js`)

**Purpose**: Image generation and analysis

**Key Function**:
```javascript
export async function pictures(env, model, params)
```

**Use Cases**:
- Text-to-image generation
- Image analysis and description
- Image classification
- Visual content understanding

**Model Types**:
- Text-to-image models
- Image classification models
- Vision-language models

### Reasoning AI (`reasonning.js`)

**Purpose**: Advanced reasoning and complex problem solving

**Key Function**:
```javascript
export async function reasonning(env, model, params)
```

**Use Cases**:
- Complex problem solving
- Mathematical reasoning
- Logical deduction
- Step-by-step explanations
- Advanced analysis

**Model Types**:
- Large language models (70B+ parameters)
- Reasoning-optimized models
- Advanced inference models

### Web Search AI (`search_web.js`)

**Purpose**: AI with real-time web search capabilities

**Key Function**:
```javascript
export async function search_web(env, model, params)
```

**Use Cases**:
- Real-time information retrieval
- Current events analysis
- Fact-checking
- Research assistance
- Up-to-date responses

**Features**:
- Web search integration
- Real-time information processing
- Source citation
- Current data access

### Notes & Remarks AI (`notes_remarks.js`)

**Purpose**: Academic note analysis and feedback

**Key Function**:
```javascript
export async function notes_remarks(env, model, params)
```

**Use Cases**:
- Study note analysis
- Homework feedback
- Academic writing assistance
- Grade improvement suggestions
- Learning recommendations

**Features**:
- Educational context understanding
- Academic feedback generation
- Learning objective alignment
- Subject-specific analysis

### Core AI (`core.js`)

**Purpose**: Core AI utilities and shared functionality

**Functions**:
- AI model invocation
- Response processing
- Error handling
- Formatting utilities

### Gateway Logs (`gateway_logs.js`)

**Purpose**: Conversation logging and management

**Functions**:
- `getConversations(env, limit, offset)`: List user conversations
- `getConversationMessages(env, conversationId, limit, offset)`: Get conversation messages
- `addDeletedConversation(env, conversationId)`: Mark conversation as deleted

**Storage**: Uses KV storage for conversation persistence

### Gateway Metadata (`gateway_metadata.js`)

**Purpose**: Gateway metadata management

**Functions**:
- `getGatewayMetadata(env)`: Retrieve gateway configuration and metadata
- Metadata caching and management

### Limits (`limits.js`)

**Purpose**: AI usage limits and tracking

**Functions**:
- `fetchCloudflareLimits(env)`: Fetch usage limits from Cloudflare API
- Usage statistics tracking
- Rate limiting
- Quota management

---

## 🤖 AI Categories

### Category Structure

```javascript
const CATEGORIES = {
  basic: "General purpose AI models",
  pictures: "Image generation and analysis",
  reasonning: "Advanced reasoning models",
  search_web: "Web search enabled models",
  notes_remarks: "Academic note analysis"
};
```

### Category Aliases

Frontend-friendly names mapped to backend categories:

```javascript
const CATEGORY_ALIASES = {
  "ai": "basic",
  "search-web": "search_web",
  "reasoning": "reasonning",
  "pictures": "pictures"
};
```

### Model Categorization

Models are categorized based on:

- **Model Size**: Small (<10B), Medium (10-34B), Large (70B+)
- **Capabilities**: Text, image, reasoning, search
- **Optimization**: Speed vs accuracy
- **Use Case**: General, specialized, educational

**Excluded Models**:
- Deprecated models
- Translation models (separate category)
- Audio models (separate category)
- LoRA/adapter models (require base models)
- Leonardo models (platform-specific)

---

## 🔌 API Endpoints

### GET `/api/ai/categories`

Get available AI models organized by category.

**Response**:
```json
{
  "categories": ["basic", "pictures", "reasonning", "search_web"],
  "availableModels": [
    {
      "model": "@cf/meta/llama-2-7b-chat-int8",
      "name": "Llama 2 7B Chat",
      "description": "General purpose chat model",
      "type": "text-generation",
      "consumption": 5,
      "categories": ["basic", "search_web"]
    }
  ],
  "categorizedModels": {
    "basic": [...],
    "pictures": [...],
    "reasonning": [...],
    "search_web": [...]
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ai/categories');
const data = await response.json();

// Display available models
data.categorizedModels.basic.forEach(model => {
  console.log(model.name, model.consumption);
});
```

### POST `/api/ai/chat`

Unified AI chat interface supporting all categories.

**Request Body**:
```json
{
  "category": "basic",
  "model": "@cf/meta/llama-2-7b-chat-int8",
  "prompt": "Explain quantum computing",
  "conversationId": "optional_conversation_id",
  "conversationName": "Optional conversation name",
  "titleGenerationModel": "optional_model_for_title"
}
```

**Response**:
```json
{
  "response": "AI response text",
  "conversationId": "conversation_id",
  "conversationName": "conversation_name",
  "usage": {
    "tokens": 150,
    "model": "model_name"
  }
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: 'basic',
    model: '@cf/meta/llama-2-7b-chat-int8',
    prompt: 'What is machine learning?',
    conversationId: existingConversationId
  })
});

const data = await response.json();
console.log(data.response);
```

### GET `/api/ai/conversations`

List user conversations with pagination.

**Query Parameters**:
- `limit`: Number of conversations to return (default: 100)
- `offset`: Number of conversations to skip (default: 0)

**Response**:
```json
{
  "conversations": [
    {
      "id": "conversation_id",
      "name": "Conversation name",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ],
  "hasMore": false,
  "error": null
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ai/conversations?limit=20&offset=0');
const data = await response.json();

data.conversations.forEach(conv => {
  console.log(conv.name, conv.created_at);
});
```

### GET `/api/ai/conversations/:id`

Get specific conversation messages with pagination.

**Query Parameters**:
- `limit`: Number of messages to return (default: 100)
- `offset`: Number of messages to skip (default: 0)

**Response**:
```json
{
  "conversationId": "conversation_id",
  "messages": [
    {
      "role": "user",
      "content": "User message",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "AI response",
      "timestamp": "2024-01-15T10:00:05Z"
    }
  ],
  "hasMore": false,
  "error": null
}
```

**Usage Example**:
```javascript
const response = await fetch(`/api/ai/conversations/${conversationId}?limit=50`);
const data = await response.json();

data.messages.forEach(msg => {
  console.log(msg.role, msg.content);
});
```

### DELETE `/api/ai/conversations/:id`

Delete a conversation by adding to deleted list.

**Response**:
```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

**Usage Example**:
```javascript
const response = await fetch(`/api/ai/conversations/${conversationId}`, {
  method: 'DELETE'
});

const result = await response.json();
if (result.success) {
  console.log('Conversation deleted');
}
```

### GET `/api/ai/limits`

Get AI usage limits and statistics.

**Response**:
```json
{
  "limit": 10000,
  "used": 1500,
  "remaining": 8500,
  "resetDate": "2024-02-01T00:00:00Z",
  "models": [
    {
      "id": "@cf/meta/llama-2-7b-chat-int8",
      "name": "Llama 2 7B Chat",
      "brand": "Meta",
      "consumption": 5,
      "consumptionPercentage": 25
    }
  ]
}
```

**Usage Example**:
```javascript
const response = await fetch('/api/ai/limits');
const data = await response.json();

console.log(`Usage: ${data.used}/${data.limit}`);
console.log(`Remaining: ${data.remaining}`);
```

---

## 🎯 Model Management

### Model Fetching

Models are fetched from Cloudflare Workers AI API:

```javascript
async function fetchCloudflareModels(env) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.result.map(model => ({
    id: model.name,
    name: formatModelName(model.name),
    brand: extractBrand(model.name),
    description: model.description,
    type: model.task?.name || model.type,
    pricing: model.pricing
  }));
}
```

### Model Categorization

Models are categorized based on capabilities:

```javascript
function categorizeModel(model) {
  const categories = [];
  
  // Exclude deprecated and special models
  if (isDeprecated(model)) return [];
  if (isLoRA(model)) return [];
  if (isTranslation(model)) return [];
  if (isAudio(model)) return [];
  
  // Categorize based on capabilities
  if (isTextToImage(model)) {
    categories.push('pictures');
  } else if (isReasoningModel(model)) {
    categories.push('reasonning');
  } else if (isTextModel(model)) {
    categories.push('basic');
    categories.push('search_web');
  }
  
  return categories;
}
```

### Consumption Estimation

Model consumption is estimated based on pricing:

```javascript
export function estimateConsumption(model) {
  const pricing = model.pricing || {};
  
  if (pricing.input && pricing.output) {
    const totalCost = parseFloat(pricing.input) + parseFloat(pricing.output);
    
    // Convert to 0-20 scale
    if (totalCost < 0.0001) return Math.round(totalCost * 30000);
    if (totalCost < 0.001) return Math.round(3 + (totalCost - 0.0001) * 4000);
    if (totalCost < 0.01) return Math.round(7 + (totalCost - 0.001) * 700);
    return Math.min(20, Math.round(14 + (totalCost - 0.01) * 60));
  }
  
  // Fallback based on model name
  if (model.type.includes('image')) return 18;
  if (model.id.includes('70b')) return 18;
  if (model.id.includes('8b')) return 3;
  
  return 5; // Default
}
```

---

## 📊 Usage Tracking

### Limits Management

Usage limits are tracked and enforced:

```javascript
async function fetchCloudflareLimits(env) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/usage`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    }
  );
  
  return await response.json();
}
```

### Conversation Storage

Conversations are stored in KV for persistence:

```javascript
async function getConversations(env, limit, offset) {
  const key = `conversations:${userId}`;
  const data = await env.KV.get(key, 'json');
  
  if (!data) return { conversations: [], hasMore: false };
  
  const conversations = data.conversations
    .slice(offset, offset + limit);
  
  return {
    conversations,
    hasMore: offset + limit < data.conversations.length
  };
}
```

### Usage Statistics

Track usage per model and category:

```javascript
{
  totalUsage: 1500,
  modelUsage: {
    "@cf/meta/llama-2-7b-chat-int8": 500,
    "@cf/meta/llama-2-70b-chat-int8": 1000
  },
  categoryUsage: {
    basic: 800,
    reasoning: 700
  }
}
```

---

## 🛠️ Development Guidelines

### Adding a New AI Category

1. **Create category module**:
```javascript
// ai/new_category.js
export async function new_category(env, model, params) {
  // Implementation
  return { response: "AI response" };
}
```

2. **Add to categories**:
```javascript
// ai/index.js
import { new_category } from "./new_category.js";

const CATEGORIES = {
  basic,
  pictures,
  reasonning,
  search_web,
  notes_remarks,
  new_category
};
```

3. **Add categorization logic**:
```javascript
function categorizeModel(model) {
  // Add categorization for new category
  if (isNewCategoryModel(model)) {
    categories.push('new_category');
  }
}
```

4. **Update documentation** and tests

### Model Selection Strategy

**Default Model Selection**:
```javascript
function selectDefaultModel(category) {
  const models = categorizedModels[category];
  
  // Select based on:
  // 1. Lowest consumption
  // 2. Best rating
  // 3. Availability
  
  return models.sort((a, b) => a.consumption - b.consumption)[0];
}
```

**Context-Aware Selection**:
```javascript
function selectModelForContext(category, context) {
  // Consider:
  // - Task complexity
  // - Response time requirements
  // - Accuracy needs
  // - User preferences
  
  if (context.requiresHighAccuracy) {
    return selectHighEndModel(category);
  } else if (context.requiresSpeed) {
    return selectFastModel(category);
  }
  
  return selectBalancedModel(category);
}
```

### Error Handling

**AI Service Errors**:
```javascript
try {
  const response = await env.AI.run(model, { prompt });
  return { response: response.response };
} catch (error) {
  console.error('AI error:', error);
  
  if (error.message.includes('rate limit')) {
    return { error: 'Rate limit exceeded' };
  } else if (error.message.includes('invalid model')) {
    return { error: 'Invalid model selected' };
  }
  
  return { error: 'AI service unavailable' };
}
```

### Performance Optimization

**Caching Strategy**:
```javascript
// Cache model list
let cachedModels = null;
let cacheTime = 0;

async function getCachedModels(env) {
  const now = Date.now();
  
  if (cachedModels && now - cacheTime < 3600000) { // 1 hour cache
    return cachedModels;
  }
  
  cachedModels = await fetchCloudflareModels(env);
  cacheTime = now;
  
  return cachedModels;
}
```

**Request Batching**:
```javascript
// Batch multiple AI requests
async function batchAIRequests(requests) {
  const results = await Promise.allSettled(
    requests.map(req => processAIRequest(req))
  );
  
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : { error: result.reason }
  );
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Model Not Available**:
- Check model ID format
- Verify Cloudflare API access
- Check account permissions
- Verify model is not deprecated

**Rate Limiting**:
- Monitor usage limits
- Implement backoff strategy
- Cache responses when possible
- Use efficient models

**High Latency**:
- Use smaller models for faster responses
- Implement streaming responses
- Optimize prompt length
- Use edge locations

**Poor Response Quality**:
- Use appropriate model for task
- Optimize prompts
- Provide context
- Use reasoning models for complex tasks

### Debugging

**Enable Detailed Logging**:
```javascript
console.log("AI Request:", { category, model, prompt });
console.log("AI Response:", response);
console.log("Usage:", usage);
```

**Monitor Model Performance**:
```javascript
const startTime = Date.now();
const response = await aiFunction(env, subpath, method, headers, body);
const duration = Date.now() - startTime;

console.log(`AI request took ${duration}ms`);
```

---

## 📚 Additional Resources

- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [AI Model Catalog](https://developers.cloudflare.com/workers-ai/models/)
- [AI Pricing](https://developers.cloudflare.com/workers-ai/pricing/)
- [Best Practices](https://developers.cloudflare.com/workers-ai/best-practices/)

---

## 🚀 Future Enhancements

Planned AI improvements:

- **Streaming Responses**: Real-time response streaming
- **Multi-modal AI**: Combined text, image, and audio processing
- **Fine-tuned Models**: Custom models for specific subjects
- **AI Agents**: Autonomous AI agents for complex tasks
- **Collaborative AI**: Multi-user AI sessions
- **Voice AI**: Speech-to-text and text-to-speech capabilities

---

## 📝 Notes

- AI models are provided by Cloudflare Workers AI
- Usage is tracked and limited per account
- Models are categorized by capability
- Conversation history is maintained
- Web search integration provides real-time data
- Image processing requires specialized models
- Reasoning models are used for complex tasks

---

<p align="center">
  <strong>Last Updated: 2024-08-15</strong>
</p>