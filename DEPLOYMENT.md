# Deployment Guide - UPUP AI Business Platform

## 🚀 Vercel Deployment Setup

### Backend Deployment

1. **Environment Variables for Vercel Backend:**
   Set these in your Vercel dashboard for the backend project:

   ```bash
   # Database (Required)
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   SUPABASE_URL=https://[PROJECT-ID].supabase.co
   SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]

   # Authentication (Required)
   JWT_SECRET=your_production_jwt_secret_min_32_chars
   JWT_EXPIRES_IN=1d

   # AI Services (At least one required)
   OPENAI_API_KEY=sk-your_openai_api_key
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key
   AI_DEFAULT_PROVIDER=openai
   AI_FALLBACK_TO_MOCK=true

   # Payment (Required for billing)
   STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
   STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

   # Content Settings (Optional)
   MAX_CONTENT_LENGTH=1000
   DEFAULT_TEMPERATURE=0.7
   ENABLE_CONTENT_CACHING=true
   ```

2. **Backend Deployment Command:**
   ```bash
   cd backend
   vercel --prod
   ```

### Frontend Deployment

1. **Update API URL:**
   Replace the backend URL in `frontend/vercel.json` with your actual backend deployment URL.

2. **Environment Variables for Vercel Frontend:**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-deployment.vercel.app/api
   ```

3. **Frontend Deployment Command:**
   ```bash
   cd frontend
   vercel --prod
   ```

## 📊 Database Setup

### Supabase Configuration

1. **Create new Supabase project** at https://supabase.com
2. **Run database initialization:**
   ```bash
   cd backend
   node src/config/db-init.js
   ```
   Or run the SQL directly in Supabase SQL Editor

3. **Set up Row Level Security (RLS):**
   - Enable RLS on all tables
   - Create tenant isolation policies
   - Set up super admin access

## 🔑 AI Service Setup

### OpenAI (Recommended)
1. Get API key from https://platform.openai.com/api-keys
2. Set `OPENAI_API_KEY` in environment variables
3. Models used: `gpt-3.5-turbo`, `gpt-4` (optional)

### Anthropic Claude (Alternative)
1. Get API key from https://console.anthropic.com
2. Set `ANTHROPIC_API_KEY` in environment variables
3. Model used: `claude-3-sonnet-20240229`

### Fallback Mode
- Set `AI_FALLBACK_TO_MOCK=true` for development
- Provides realistic mock content when AI services are unavailable
- Useful for testing and demos

## 💳 Stripe Setup

1. **Create Stripe account** at https://stripe.com
2. **Get API keys** from Stripe Dashboard
3. **Set up webhook endpoints:**
   - Endpoint URL: `https://your-backend.vercel.app/api/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## 🔐 Security Checklist

- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS only in production
- [ ] Set up proper CORS policies
- [ ] Enable Supabase RLS policies
- [ ] Use environment variables for all secrets
- [ ] Regular security audits with `npm audit`

## 🚀 Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: Add AI content generation platform"
   git push origin main
   ```

2. **Deploy Backend:**
   - Connect GitHub repo to Vercel
   - Set environment variables
   - Deploy from `backend` folder

3. **Deploy Frontend:**
   - Connect GitHub repo to Vercel
   - Update API URL in vercel.json
   - Deploy from `frontend` folder

4. **Verify Deployment:**
   - Test authentication flow
   - Test content generation
   - Test pin functionality
   - Test template generation

## 🐛 Troubleshooting

### Common Issues:

1. **AI Generation Fails:**
   - Check API keys are valid
   - Verify rate limits not exceeded
   - Enable fallback mode: `AI_FALLBACK_TO_MOCK=true`

2. **Database Connection Issues:**
   - Verify Supabase credentials
   - Check database URL format
   - Ensure RLS policies are configured

3. **Authentication Problems:**
   - Check JWT secret is set
   - Verify frontend API URL is correct
   - Test subdomain routing

4. **Build Failures:**
   - Run `npm install` to update dependencies
   - Check Node.js version compatibility
   - Verify all environment variables are set

## 📈 Monitoring

- Use Vercel Analytics for performance monitoring
- Set up Supabase logging for database issues
- Monitor AI API usage and costs
- Track user engagement with content generation features

## 🔄 Updates

When updating the application:

1. Test locally first
2. Deploy to staging environment
3. Run database migrations if needed
4. Deploy to production
5. Monitor for any issues

---

**Need Help?**
- Check Vercel deployment logs
- Review Supabase database logs
- Test API endpoints with tools like Postman
- Verify environment variables in Vercel dashboard