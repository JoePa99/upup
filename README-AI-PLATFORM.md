# 🚀 UPUP - AI Business Platform

*Up, Up, Down, Down* - An intelligent multi-tenant SaaS platform that transforms your business operations with AI-powered content generation, strategic insights, and professional templates.

## ✨ Key Features

### 🎯 AI Content Generation
- **Strategic Content Generator** - Create compelling business content tailored to your brand
- **Growth Opportunities Analyzer** - Identify and develop strategic growth initiatives  
- **Market Insights Generator** - Understand market dynamics and competitive landscape
- **Customer Connection Strategies** - Develop deeper customer relationships

### 📌 Intelligent Content Curation
- **Sentence-Level Pinning** - Click any sentence in generated content to pin it
- **Smart Pin Management** - Edit, organize, and manage your favorite insights
- **Content Creation from Pins** - Generate new strategic content from curated insights
- **Cross-Generator Persistence** - Pins work across all content generators

### 📋 Professional Templates
- **HR Templates** - Job descriptions, performance reviews, interview guides
- **Legal Templates** - NDAs, service agreements, employment contracts
- **Sales Templates** - Proposals, email sequences, call scripts

### 🏢 Multi-Tenant Architecture
- **Complete Data Isolation** - Each customer has their own secure environment
- **Subdomain Routing** - `customer.yourplatform.com` structure
- **Scalable Infrastructure** - Built for growth and enterprise needs

## 🛠 Tech Stack

**Frontend:**
- ⚡ Next.js 13+ with React 18
- 🎨 CSS Modules with responsive design
- 🔐 JWT authentication with context
- 📱 Mobile-first responsive UI

**Backend:**
- 🚀 Node.js with Express.js
- 🗄️ PostgreSQL with Row Level Security (RLS)
- 🤖 OpenAI GPT & Anthropic Claude integration
- 🔒 Multi-tenant security architecture

**Infrastructure:**
- ☁️ Vercel deployment ready
- 🗃️ Supabase for database and auth
- 💳 Stripe for subscription billing
- 📊 Usage tracking and analytics

## 🎮 Demo Flow

1. **Dashboard Overview** - See platform statistics and quick access to tools
2. **Generate Content** - Create strategic business content with AI assistance
3. **Pin Insights** - Click sentences you love to save them for later
4. **Curate & Create** - Build new content from your pinned insights
5. **Professional Templates** - Generate HR, legal, and sales documents
6. **Export & Share** - Download content in multiple formats

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database (Supabase recommended)
- OpenAI or Anthropic API key

### Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-org/upup.git
   cd upup
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies  
   cd ../frontend && npm install
   ```

2. **Environment Setup**
   ```bash
   # Backend .env
   cp backend/.env.example backend/.env
   # Fill in your API keys and database credentials
   
   # Frontend .env.local
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > frontend/.env.local
   ```

3. **Database Setup**
   ```bash
   cd backend
   node src/config/db-init.js
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

5. **Open Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Backend Deployment**
   ```bash
   cd backend
   vercel --prod
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Environment Variables**
   Set these in your Vercel dashboard:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `ANTHROPIC_API_KEY` - Your Anthropic API key  
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Strong secret for JWT tokens
   - `STRIPE_SECRET_KEY` - Stripe API key for billing

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🏗 Architecture

### Multi-Tenant Design
```
customer1.platform.com ──┐
                         ├─► Frontend (Next.js)
customer2.platform.com ──┤
                         └─► Backend API ──► Database (Row Level Security)
```

### Content Generation Flow
```
User Input ──► AI Service ──► Generated Content ──► Sentence Parsing ──► Pin Management
                   │                                        │
                   ▼                                        ▼
            Mock Fallback                            Local Storage + API
```

### Database Schema
- **Tenants** - Customer organizations
- **Users** - Individual users within tenants
- **Content Generations** - AI-generated content tracking
- **Pinned Sentences** - User-curated content insights
- **Created Content** - Content built from pinned insights

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level tenant isolation
- **JWT Authentication** - Secure token-based auth
- **Input Sanitization** - Protection against injection attacks
- **Rate Limiting** - API abuse prevention
- **Environment Variable Security** - Secrets management

## 📊 AI Integration

### Supported Providers
- **OpenAI** - GPT-3.5 Turbo, GPT-4 (primary)
- **Anthropic** - Claude 3 Sonnet (secondary)
- **Mock Fallback** - Development and demo mode

### Content Types
- Strategic business content
- Growth opportunity analysis
- Market research insights
- Customer relationship strategies
- Professional document templates

## 🎯 Usage Tracking

- AI API call monitoring
- Storage usage tracking
- Email sending quotas
- Audio processing minutes
- Per-tenant usage analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@upup.ai
- 📖 Documentation: [docs.upup.ai](https://docs.upup.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/upup/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-org/upup/discussions)

## 🙏 Acknowledgments

- OpenAI for GPT integration
- Anthropic for Claude integration  
- Vercel for deployment platform
- Supabase for backend infrastructure
- The open-source community

---

**Built with ❤️ by the UPUP Team**

*Transform your business operations with AI-powered insights and professional content generation.*