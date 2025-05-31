# 🤖 AI API Setup Instructions

## Overview
Your UPUP platform is now configured to use real AI APIs instead of mock responses. Follow these steps to enable AI-powered content generation.

## Quick Setup

### 1. Get API Keys

**Option A: OpenAI (Recommended)**
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-...`)

**Option B: Anthropic Claude**
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key
5. Copy your API key (starts with `sk-ant-...`)

### 2. Add API Keys to Environment

Edit `backend/.env` file and replace the placeholder values:

```bash
# Replace these with your actual API keys
OPENAI_API_KEY=sk-your_actual_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_actual_anthropic_key_here

# Optional: Set to false once you have real API keys
AI_FALLBACK_TO_MOCK=false
```

### 3. Restart the Application

```bash
# Terminal 1: Start backend
cd UPUP/backend
npm run dev

# Terminal 2: Start frontend  
cd UPUP/frontend
npm run dev
```

## 🎯 Test Real AI Integration

1. Open the application at http://localhost:3000
2. Go to any content generator (Content Generator, Market Insights, etc.)
3. Fill out the form and click "Generate"
4. Look for these indicators of real AI:
   - Content should be unique each time
   - Generation takes 3-10 seconds (not instant)
   - Content quality should be higher and more specific

## 💰 API Costs

**OpenAI GPT-3.5-turbo:**
- ~$0.001-0.002 per content generation
- Very affordable for testing and development

**Anthropic Claude:**
- ~$0.003-0.015 per content generation
- Higher quality, slightly more expensive

## 🔧 Configuration Options

In `backend/.env`, you can adjust:

```bash
# Which AI provider to use first
AI_DEFAULT_PROVIDER=openai  # or 'anthropic'

# Fallback to mock if APIs fail
AI_FALLBACK_TO_MOCK=true   # or 'false'

# Content length (tokens)
MAX_CONTENT_LENGTH=1000    # Increase for longer content

# Creativity level
DEFAULT_TEMPERATURE=0.7    # 0.0 = focused, 1.0 = creative
```

## 🚨 Troubleshooting

**Problem: Still getting mock content**
- Check that your API key is valid and has credits
- Verify no spaces or extra characters in the .env file
- Restart the backend server after changing .env

**Problem: "API service unavailable" error**
- Check your internet connection
- Verify API key is correct
- Make sure you have credits/quota remaining

**Problem: Content generation is slow**
- This is normal! Real AI takes 3-10 seconds
- Mock responses are instant, real AI is not

## ✅ Success Indicators

You'll know real AI is working when:
- ✅ Content generation takes several seconds
- ✅ Each generation produces unique content
- ✅ Content quality is noticeably higher
- ✅ Content is more specific to your inputs
- ✅ No "fallback mode" alerts appear

## 🎉 What's Now Possible

With real AI APIs enabled:
- **Unique Content**: Every generation is original
- **Better Quality**: Professional, strategic insights
- **Topic Specificity**: Content tailored to your exact inputs
- **Audience Targeting**: Content adapted for different audiences
- **Content Types**: Proper formatting for blogs, emails, strategy docs
- **Pin-based Creation**: AI synthesizes your curated insights

## 📋 Next Steps

1. **Set up API keys** (5 minutes)
2. **Test content generation** (2 minutes)
3. **Try different content types** with the new dropdowns
4. **Create content from pinned sentences** 
5. **Deploy to Vercel** with API keys in environment variables

---

**Need Help?** Check the console logs in your browser or terminal for detailed error messages.