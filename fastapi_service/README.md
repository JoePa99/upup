# 🚀 UPUP FastAPI Content Service

A high-performance streaming content generation service that provides real-time AI content generation with knowledge base integration.

## Features

- **🔥 Streaming Responses**: Content appears as it's being generated (like ChatGPT)
- **📚 Knowledge Base Integration**: Automatically incorporates company-specific knowledge
- **⚡ High Performance**: Async FastAPI for better concurrent handling
- **🔐 Secure**: Token-based authentication
- **📊 Real-time Metadata**: Shows knowledge base status during generation

## Quick Start

### 1. Setup
```bash
cd fastapi_service
./setup.sh
```

### 2. Configure Environment
```bash
# Copy and edit environment file
cp .env.example .env

# Add your OpenAI API key to .env
OPENAI_API_KEY=your_key_here
```

### 3. Start the Service
```bash
# Activate virtual environment
source venv/bin/activate

# Start the FastAPI service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Streaming Content Generation
```http
POST /content/generate/stream
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "topic": "Digital Marketing Trends",
  "contentType": "Blog Post",
  "audience": "Business Professionals",
  "additionalContext": "Focus on SMB market"
}
```

**Response**: Server-Sent Events stream with real-time content

### Non-Streaming Content Generation
```http
POST /content/generate
```
Same request format, returns complete content in one response.

## Frontend Integration

### Using the Streaming Component

1. **Import the component**:
```javascript
import StreamingContentGenerator from '../components/StreamingContentGenerator';
```

2. **Add to your page**:
```javascript
export default function ContentPage() {
  return (
    <div>
      <h1>Content Generator</h1>
      <StreamingContentGenerator />
    </div>
  );
}
```

### Using the API Directly

```javascript
const response = await fetch('http://localhost:8000/content/generate/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    topic: 'Your Topic',
    contentType: 'Blog Post',
    audience: 'General Audience'
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = new TextDecoder().decode(value);
  // Process streaming data
}
```

## Deployment

### Docker
```bash
docker build -t upup-fastapi .
docker run -p 8000:8000 --env-file .env upup-fastapi
```

### Railway/Render/etc
1. Connect your repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (OPENAI_API_KEY)

## Integration with Next.js

The FastAPI service integrates seamlessly with your existing Next.js application:

1. **Knowledge Base**: Fetches company knowledge from Next.js API
2. **Authentication**: Uses your existing auth tokens
3. **CORS**: Configured for your domain
4. **Fallback**: Non-streaming endpoint for compatibility

## Development

### Run in Development Mode
```bash
uvicorn main:app --reload --port 8000
```

### Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test content generation
curl -X POST http://localhost:8000/content/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"topic": "Test", "contentType": "Blog Post", "audience": "General"}'
```

## Architecture

```
Frontend (Next.js) → FastAPI Service → OpenAI API
                 ↗                 ↘
           Auth & Knowledge    Streaming Response
```

The service acts as a streaming proxy that:
1. Receives content requests from frontend
2. Fetches knowledge base context from Next.js API
3. Streams responses from OpenAI back to frontend
4. Provides real-time generation feedback

## Performance Benefits

- **Immediate Response**: Users see content appearing instantly
- **Better UX**: Real-time feedback instead of loading spinner
- **Scalability**: Async handling for concurrent users
- **Efficiency**: Streams data instead of buffering everything

## Next Steps

1. Deploy the FastAPI service
2. Update your frontend to use the streaming component
3. Configure your domain in CORS settings
4. Monitor performance and scale as needed