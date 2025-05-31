# Deploy to Vercel - Monorepo Setup

## 🚀 Quick Deploy

### 1. Connect to Vercel
```bash
cd UPUP
npx vercel
```

Follow the prompts:
- Link to existing project? **No**
- Project name: **upup** (or whatever you prefer)
- Directory: **.** (current directory - this is important!)

### 2. Set Environment Variables

After deployment, go to your Vercel dashboard and add these environment variables:

#### Database (Supabase)
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

#### AI Services
```
OPENAI_API_KEY=sk-your_openai_api_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key
AI_DEFAULT_PROVIDER=openai
AI_FALLBACK_TO_MOCK=false
```

#### Authentication
```
JWT_SECRET=your_production_jwt_secret_use_a_long_random_string
JWT_EXPIRES_IN=1d
```

#### Optional (Stripe for billing)
```
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### 3. Redeploy
After adding environment variables:
```bash
npx vercel --prod
```

## 🎯 How It Works

### Monorepo Structure
- **Frontend**: Deployed as Next.js app at your domain root
- **Backend**: Deployed as Vercel serverless functions at `/api/*`

### URL Structure
- `https://your-app.vercel.app/` → Frontend (Next.js)
- `https://your-app.vercel.app/api/health` → Backend API
- `https://your-app.vercel.app/api/content/generate` → Content generation
- `https://your-app.vercel.app/dashboard` → Frontend dashboard

### Environment Variables in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all the variables listed above

## 🔧 Troubleshooting

### Build Issues
- Make sure you're deploying from the root directory (where `vercel.json` is)
- Check that all environment variables are set in Vercel dashboard

### API Issues
- Test API endpoints: `https://your-app.vercel.app/api/health`
- Check function logs in Vercel dashboard
- Verify environment variables are correct

### Database Issues
- Test your Supabase connection string locally first
- Make sure your Supabase project allows connections from Vercel IPs
- Check if you need to add `0.0.0.0/0` to allowed IPs (for development)

### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Make sure frontend is using `/api/*` routes, not `localhost`

## 📋 Post-Deployment Checklist

- [ ] Site loads at your Vercel URL
- [ ] API health check works: `/api/health`
- [ ] Content generation works (test a generator)
- [ ] AI services respond (not just mock)
- [ ] Database connection works
- [ ] Authentication works (if enabled)

## 🎉 Success!

Your app will be available at: `https://your-app-name.vercel.app`

Both frontend and backend are deployed as a single app with the backend available at `/api/*` routes.