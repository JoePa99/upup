# 🚀 FastAPI Service Deployment Guide

## Quick Deploy to Railway (Recommended)

### 1. Deploy FastAPI Service

1. **Go to [Railway.app](https://railway.app)**
2. **Connect your GitHub account**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Choose `/fastapi_service` as the root directory**

### 2. Set Environment Variables in Railway

In Railway dashboard → Variables tab, add:

```
OPENAI_API_KEY=your_openai_api_key_here
NEXTJS_API_URL=https://upup-bn6a.vercel.app
```

### 3. Get Your Railway Domain

After deployment, Railway will give you a domain like:
`https://your-project-name.up.railway.app`

### 4. Update Vercel Environment Variables

In your Vercel dashboard, add:

```
NEXT_PUBLIC_FASTAPI_URL=https://your-project-name.up.railway.app
```

### 5. Test the Deployment

Visit: `https://your-project-name.up.railway.app/health`

You should see: `{"status": "healthy", "service": "UPUP FastAPI Content Service"}`

## Alternative: Deploy to Render

### 1. Connect to Render

1. Go to [Render.com](https://render.com)
2. Connect GitHub account
3. Click "New" → "Web Service"
4. Select your repository

### 2. Configure Build Settings

```
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 3. Set Environment Variables

Same as Railway:
- `OPENAI_API_KEY`
- `NEXTJS_API_URL`

## Integration Steps

### 1. Add Streaming Component to Your App

Create a new page or replace existing content generator:

```javascript
// pages/streaming-content.js
import StreamingContentGenerator from '../components/StreamingContentGenerator';

export default function StreamingContentPage() {
  return (
    <div>
      <h1>🚀 Streaming Content Generator</h1>
      <StreamingContentGenerator />
    </div>
  );
}
```

### 2. Update Your Authentication

The streaming component expects a token in localStorage. Make sure your auth system stores it:

```javascript
// After successful login
localStorage.setItem('authToken', userToken);
```

### 3. Test the Integration

1. **Deploy both services**
2. **Go to your streaming content page**
3. **Try generating content**
4. **You should see real-time streaming!**

## Troubleshooting

### CORS Issues
If you get CORS errors, update the FastAPI CORS configuration with your exact domain:

```python
allow_origins=[
    "https://your-actual-domain.vercel.app",
    "https://upup-bn6a.vercel.app"
]
```

### Authentication Issues
Make sure the token format matches. Check browser DevTools → Network tab to see the actual request headers.

### Knowledge Base Not Working
Verify that `NEXTJS_API_URL` environment variable points to your correct Vercel domain.

## Performance Tips

### 1. Add Caching
Railway/Render automatically handle caching, but you can add Redis for better performance.

### 2. Monitor Usage
Both platforms provide usage dashboards to monitor performance.

### 3. Scale Up
Start with free tier, upgrade as needed based on usage.

## Cost Estimate

### Railway
- **Free tier**: 500 hours/month
- **Paid**: $5/month for unlimited

### Render  
- **Free tier**: 750 hours/month
- **Paid**: $7/month for unlimited

## Next Steps

1. **Deploy the FastAPI service** using Railway or Render
2. **Update environment variables** in both services
3. **Test the streaming functionality**
4. **Integrate with your existing UI** or use the provided component
5. **Monitor performance** and scale as needed

The streaming content generation will make your AI platform feel modern and responsive, just like ChatGPT! 🚀