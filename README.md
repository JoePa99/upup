# UPUP - AI Business Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR-USERNAME%2FUPUP)

UPUP is a comprehensive AI-powered business platform with 5 core pillars designed for small and medium businesses:

- **Create**: Content generation with brand compliance
- **Communicate**: Customer/prospect interactions and meeting intelligence
- **Understand**: Data insights and business intelligence
- **Grow**: Market opportunity discovery and validation
- **Operate**: Business operations automation (hiring, legal, processes)

## Tech Stack

- **Backend**: Node.js/Express with PostgreSQL (Supabase)
- **Frontend**: React/Next.js
- **Authentication**: JWT + Supabase Auth
- **Database**: PostgreSQL with row-level security (Supabase)
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **AI Integration**: OpenAI, Anthropic Claude
- **Billing**: Stripe

## Multi-Tenant Architecture

- Complete data isolation between customer organizations
- Subdomain per tenant (customer1.yourplatform.com)
- Tenant-aware database with row-level security
- Automated tenant provisioning

## Deployment Instructions

### Backend

1. Create a Supabase project and database
2. Deploy to Vercel and set the following environment variables:
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY

### Frontend

1. Deploy to Vercel
2. Set the NEXT_PUBLIC_API_URL environment variable to your backend URL

## Initial Setup

After deployment, create a super admin account:

```bash
curl -X POST https://your-backend-url.vercel.app/api/setup/super-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"securepassword","firstName":"Admin","lastName":"User"}'
```

## License

MIT