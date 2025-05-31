# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd UPUP/backend
npm install
```

### 2. Environment Setup

**Option A: Quick Test (Mock Mode)**
```bash
# Copy the existing .env and update these minimal values:
cp .env .env.backup
```

Edit your `.env` file with these minimum values for testing:
```bash
PORT=3001
NODE_ENV=development
JWT_SECRET=development_secret_key
AI_FALLBACK_TO_MOCK=true
```

**Option B: Full Setup**
You'll need:
1. **Supabase Account** (free): https://supabase.com
2. **OpenAI API Key** (paid): https://platform.openai.com
3. **Anthropic API Key** (optional): https://console.anthropic.com

### 3. Start the Server
```bash
npm run dev
```

The server will start on http://localhost:3001

### 4. Test the API
```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok","message":"Service is running"}`

## Setting Up Real Services

### Supabase Database Setup
1. Go to https://supabase.com and create a new project
2. In your dashboard, go to Settings > Database
3. Copy the connection string and add to `.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
   ```
4. Go to Settings > API and copy:
   ```
   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

### OpenAI API Setup
1. Go to https://platform.openai.com
2. Create an API key
3. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your_openai_api_key_here
   ```

## Available Endpoints

- `GET /api/health` - Health check
- `POST /api/content/generate` - Generate AI content
- `GET /api/tenant/usage` - Get usage statistics
- More endpoints available in the routes files

## Troubleshooting

### Server won't start
- Check that Node.js version is >= 16
- Run `npm install` again
- Check the console for specific error messages

### Database connection issues
- Verify your Supabase credentials
- Check if your IP is allowed in Supabase
- Try the connection string in a database client

### AI services not working
- The backend will fall back to mock responses if `AI_FALLBACK_TO_MOCK=true`
- Check your API keys are correct
- Verify you have credits/usage available

## Development vs Production

### Development
- Uses mock data when services aren't configured
- CORS is enabled for localhost:3000
- More verbose logging

### Production (Vercel)
- Requires all environment variables
- SSL enforced for database connections
- CORS restricted to your domain

## Next Steps

1. Get the backend running locally
2. Test the API endpoints
3. Connect the frontend to your local backend
4. Deploy to Vercel when ready