const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Claude client (Anthropic)
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const aiService = {
  // Generate content using AI (defaults to OpenAI, falls back to Claude)
  async generateAIContent(prompt, options = {}) {
    const {
      maxTokens = parseInt(process.env.MAX_CONTENT_LENGTH) || 500,
      temperature = parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
      model = 'gpt-3.5-turbo',
      provider = process.env.AI_DEFAULT_PROVIDER || 'openai'
    } = options;

    try {
      if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
        return await this.generateWithClaude(prompt, { maxTokens, temperature });
      } else if (process.env.OPENAI_API_KEY) {
        return await this.generateWithOpenAI(prompt, { maxTokens, temperature, model });
      } else {
        // Fallback to mock responses for development
        return this.generateMockContent(prompt);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      
      // Fallback to mock content if AI services fail and fallback is enabled
      if (process.env.AI_FALLBACK_TO_MOCK === 'true') {
        console.log('Falling back to mock content generation');
        return this.generateMockContent(prompt);
      } else {
        throw new Error('AI service unavailable and fallback disabled');
      }
    }
  },

  // Generate content using OpenAI
  async generateWithOpenAI(prompt, options) {
    const { maxTokens, temperature, model } = options;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a strategic business consultant specializing in premium brands and creative industries. Provide professional, actionable insights with specific examples."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    });

    return completion.choices[0].message.content.trim();
  },

  // Generate content using Claude (Anthropic)
  async generateWithClaude(prompt, options) {
    const { maxTokens, temperature } = options;

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [
        {
          role: "user",
          content: `You are a strategic business consultant specializing in premium brands and creative industries. ${prompt}`
        }
      ],
    });

    return message.content[0].text.trim();
  },

  // Mock content generation for development/fallback
  generateMockContent(prompt) {
    const mockResponses = {
      content: `Building authentic customer relationships starts with understanding that trust isn't built overnight—it's earned through consistent actions over time. Your customers are constantly evaluating whether your brand delivers on its promises, not just in your premium products, but in every interaction they have with your company. The most successful businesses recognize that customer trust is their most valuable asset, worth more than any short-term revenue boost from aggressive pricing tactics. When customers trust your brand, they become advocates who refer others, provide honest feedback about new products, and stick with you even when competitors offer cheaper alternatives. Modern consumers have access to unlimited information and options, which means they can easily spot inauthentic marketing messages from brands trying too hard to be trendy. The companies that thrive are those that speak honestly about their values and capabilities, rather than making unrealistic promises about instant success. Social proof through customer testimonials and case studies has become crucial, but only when it feels genuine rather than manufactured for marketing purposes. Your company's response to product issues often matters more than preventing every single problem, as it shows how you handle challenges and treat customers when things go wrong. Transparency in your processes and commitment to sustainable practices builds confidence and reduces the friction that causes customers to hesitate before making premium purchases. The most powerful trust-building strategy is to consistently deliver slightly more value than customers expect, creating positive surprises that they remember and share with others.`,
      
      growth: `Your revenue expansion opportunities lie in leveraging your premium brand positioning to capture higher-value market segments within the specified timeframe. The growing market of professionals who value quality tools represents a significant opportunity that aligns perfectly with your brand heritage. Your craftsmanship story resonates powerfully with customers who prioritize quality over price, creating natural upselling opportunities from basic products to premium offerings. The trend toward mindful consumption and authentic experiences opens doors to position your products as premium lifestyle choices, not just functional tools. Partnership opportunities with high-end retailers, professional organizations, and industry leaders could generate recurring revenue through strategic alliances and brand partnerships. Your existing customer relationships provide the foundation for expanded product placement and cross-selling, potentially increasing average transaction value significantly. The rise of specialized markets presents opportunities to develop targeted product lines that command premium pricing while serving growing niche demands. E-commerce expansion beyond traditional channels into lifestyle and luxury platforms could capture customers who view quality products as investments rather than just purchases. International expansion into emerging markets with growing professional populations offers revenue growth potential that leverages your existing capabilities and brand recognition. Strategic partnerships with complementary brands could create new revenue streams while introducing your products to customers who might not otherwise discover your offerings.`,
      
      market: `Customer behavior in the premium market reveals a fundamental shift toward quality-over-quantity purchasing decisions, particularly among professionals who view tools as investments in their success. Today's customers research extensively before making purchases, often spending weeks evaluating options and reading reviews from peers before committing to premium brands. The decision-making process is heavily influenced by recommendations and social proof, with professional networks being the primary source of purchase influence. Price sensitivity decreases significantly when customers understand the connection between quality and outcomes, making education and demonstration crucial for converting prospects to premium purchases. Younger professionals show strong preference for brands with authentic heritage stories and sustainable practices, creating opportunities for companies with genuine narratives to resonate beyond just product quality. The rise of digital tools hasn't diminished demand for quality traditional products—instead, it's created a more discerning customer base that values authentic experiences as supplements to digital work. Professional customers exhibit strong brand loyalty once they find products that consistently meet their requirements, with repeat purchase rates being significantly higher for satisfied premium customers. The buying journey increasingly starts online even for offline purchases, with customers researching specifications, watching demonstrations, and comparing products before visiting physical locations. Professional customers value detailed product information and technical specifications more than lifestyle marketing, preferring to understand exactly how products will perform in their specific applications. Purchase timing often aligns with project cycles and seasonal patterns, creating predictable demand that smart inventory management can capitalize on for improved margins and customer satisfaction.`,
      
      customer: `Professional customers value consistency and reliability above all else in their relationships with premium brands, making retention strategies focus on delivering predictable quality and performance with every interaction. These customers develop deep emotional connections to brands that help them achieve their best work, transforming functional purchases into long-term loyalty that extends across entire product lines. The key to improving retention lies in understanding that professionals view premium products as extensions of their professional identity, not just disposable supplies. Regular communication that provides industry insights, technique tips, and professional spotlights builds community while keeping your brand top-of-mind during the long intervals between purchases. Professional customers appreciate being recognized for their expertise and achievements, creating opportunities to feature customer work and success stories in marketing materials and communications. The most effective retention strategy involves creating exclusive access to new products, special editions, and behind-the-scenes content that makes customers feel like insiders rather than just buyers. Customers respond positively to educational content that helps them improve their skills, positioning your brand as a partner in their professional journey rather than just a supplier. Quality assurance programs that guarantee product consistency and offer immediate support for any issues build trust and reduce switching to competitive brands. Timing communications around typical professional cycles and seasonal patterns ensures your messages arrive when customers are most receptive and likely to make purchasing decisions. The most successful retention approaches acknowledge that professional customers are running businesses themselves, so communications should respect their time while providing genuine value that supports their professional success and growth.`
    };

    // Determine which mock response to use based on prompt content
    if (prompt.toLowerCase().includes('growth') || prompt.toLowerCase().includes('opportunities')) {
      return mockResponses.growth;
    } else if (prompt.toLowerCase().includes('market') || prompt.toLowerCase().includes('insights')) {
      return mockResponses.market;
    } else if (prompt.toLowerCase().includes('customer') || prompt.toLowerCase().includes('retention')) {
      return mockResponses.customer;
    } else {
      return mockResponses.content;
    }
  },

  // Generate AI suggestions for form fields
  async generateSuggestions(fieldType, context = '') {
    const suggestions = {
      contentTopic: ['customer retention strategies', 'holiday marketing campaigns', 'brand storytelling', 'competitive differentiation', 'product launch strategy', 'market positioning', 'customer onboarding', 'pricing strategy'],
      
      contentAudience: ['Professional artists and designers', 'Art students and educators', 'Creative agencies and studios', 'Art supply retailers', 'Corporate design teams', 'Freelance creatives', 'Art therapy practitioners', 'Design students'],
      
      growthConstraints: ['Limited marketing budget', 'Small team capacity', 'Seasonal demand fluctuations', 'Supply chain dependencies', 'Regulatory compliance requirements', 'Geographic limitations', 'Technology constraints', 'Competitive pressure'],
      
      specificCompetitors: ['Faber-Castell', 'Pilot Corporation', 'Prismacolor', 'Copic', 'Sakura', 'Winsor & Newton', 'Daler-Rowney', 'Royal Talens'],
      
      currentChallenges: ['High customer acquisition costs', 'Seasonal sales variations', 'Competition from digital tools', 'Retail partner relationships', 'Brand awareness in new markets', 'Customer retention issues', 'Supply chain disruptions', 'Pricing pressure']
    };

    return suggestions[fieldType] || [];
  }
};

module.exports = aiService;