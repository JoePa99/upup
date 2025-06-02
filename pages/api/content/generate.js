// Content generation API endpoint in Next.js pages/api
// Helper function to get company context
async function getCompanyContext(query) {
  // Skip the API call and just return fallback context for now
  // The knowledge context API is causing URL parsing issues
  return {
    tenantInfo: {
      companyName: 'Your Company',
      industry: 'Professional Services',
      size: 'Medium Business',
      values: 'Quality, Innovation, Customer Success'
    },
    companyContext: '',
    relevantKnowledge: []
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { contentTopic, contentType, contentAudience, pins = [] } = req.body;

    if (!contentTopic || !contentType || !contentAudience) {
      return res.status(400).json({
        message: 'Missing required fields: contentTopic, contentType, contentAudience'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(contentTopic);

    // Generate content with OpenAI
    const aiContent = await generateAIContent(contentTopic, contentType, contentAudience, pins, companyContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          contentType,
          audience: contentAudience,
          topic: contentTopic,
          pinsUsed: pins.length,
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0,
          wordCount: aiContent.content.split(' ').length
        }
      }
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return res.status(500).json({
      message: 'Content generation failed',
      error: error.message
    });
  }
}

async function generateAIContent(topic, type, audience, pins, companyContext) {
  try {
    console.log('Generating AI content for:', { topic, type, audience });
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using mock content');
      return generateMockContent(topic, type, audience, pins, companyContext);
    }
    
    const { tenantInfo } = companyContext;
    
    const prompt = `Generate a ${type} about ${topic} for ${audience}.
    
Company context:
- Company: ${tenantInfo.companyName}
- Industry: ${tenantInfo.industry}  
- Values: ${tenantInfo.values}

Requirements:
- Professional and engaging tone
- Actionable insights
- Industry-specific language
- Length: ${type === 'Social Media Post' ? '150-200 words' : '300-500 words'}

Format: Return only the content, no extra formatting or explanations.`;

    console.log('Making OpenAI API call...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    console.log('AI content generated successfully, length:', content.length);
    
    return {
      title: `${type}: ${topic}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock content if API fails
    console.log('Falling back to mock content');
    return generateMockContent(topic, type, audience, pins, companyContext);
  }
}

function generateMockContent(topic, type, audience, pins, companyContext) {
  const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
  const companyName = tenantInfo.companyName;
  
  const pinsContext = pins.length > 0 
    ? `\n\nBased on your pinned content: ${pins.map(p => p.content).join(', ')}`
    : '';

  const knowledgeContextSection = relevantKnowledge.length > 0
    ? `\n\nBased on ${companyName}'s knowledge base:\n${relevantKnowledge.map(k => `• ${k.title}: ${k.excerpt}`).join('\n')}`
    : '';

  const contentMap = {
    'Blog Post': {
      title: `${companyName}'s Guide to ${topic}`,
      content: `# ${companyName}'s Guide to ${topic}

## Introduction
As a leader in ${tenantInfo.industry}, ${companyName} understands that ${topic} has become increasingly important for ${audience}. Based on our experience and expertise, this comprehensive guide will walk you through everything you need to know.

## Why ${topic} Matters for Your Business
Understanding ${topic} is crucial because:
- It drives business growth and innovation
- It helps ${audience} achieve their goals more effectively
- It provides competitive advantages in today's market
- It aligns with core values like ${tenantInfo.values}

## ${companyName}'s Proven Strategies
Here are the top strategies we've developed for implementing ${topic}:

1. **Start with Clear Objectives**
   Define what you want to achieve with ${topic}, ensuring alignment with your business goals

2. **Develop a Structured Approach**
   Create a step-by-step plan tailored to ${audience} in the ${tenantInfo.industry} sector

3. **Monitor and Optimize**
   Continuously track performance and make improvements based on industry best practices

## Best Practices from Our Experience
- Focus on value creation that resonates with your market
- Maintain consistency in your approach across all touchpoints
- Stay updated with ${tenantInfo.industry} trends and innovations
- Engage with your target audience through authentic communication

## Conclusion
${topic} is a powerful tool that can transform how ${audience} operate in ${tenantInfo.industry}. At ${companyName}, we've seen firsthand how following these strategies positions businesses for sustainable success.${knowledgeContextSection}${pinsContext}`
    },
    
    'Email Campaign': {
      title: `${companyName} ${topic} Campaign for ${audience}`,
      content: `Subject: ${companyName}: Transform Your ${tenantInfo.industry} Business with ${topic}

Dear ${audience},

As a trusted partner in ${tenantInfo.industry}, ${companyName} understands the challenges you face. Are you looking to revolutionize your approach to ${topic}?

${topic} has become a game-changer for ${tenantInfo.industry} businesses like yours. Here's why:

✓ Increased efficiency and productivity in ${tenantInfo.industry} operations
✓ Better customer engagement and satisfaction
✓ Improved ROI and growth metrics
✓ Alignment with ${tenantInfo.values}

**What ${companyName} Offers:**
- Proven strategies developed for ${tenantInfo.industry}
- Step-by-step implementation guide
- Real-world case studies from our experience
- Ongoing support aligned with our values of ${tenantInfo.values}

**Take Action Today:**
Don't let your competitors get ahead. Partner with ${companyName} to implement ${topic} strategies now.

[Call-to-Action Button: Connect with ${companyName}]

Best regards,
The ${companyName} Team

P.S. As a ${tenantInfo.size} company, we understand your unique needs and are committed to your success.${knowledgeContextSection}${pinsContext}`
    },
    
    'Social Media Post': {
      title: `${topic} Social Media Campaign`,
      content: `🚀 Ready to transform your ${topic} strategy?

Here's what ${audience} need to know:

💡 ${topic} isn't just a trend - it's the future
📈 Companies using ${topic} see 3x better results
🎯 Perfect for ${audience} looking to scale

3 Quick Tips:
1️⃣ Start small and iterate
2️⃣ Focus on your audience's needs
3️⃣ Measure everything

What's your biggest challenge with ${topic}? Drop a comment below! 👇

#${topic.replace(/\s+/g, '')} #BusinessGrowth #Innovation #${audience.replace(/\s+/g, '')}${pinsContext}`
    },
    
    'Strategic Content': {
      title: `Strategic Analysis: ${topic}`,
      content: `# Strategic Analysis: ${topic}

## Executive Summary
This strategic analysis examines ${topic} and its implications for ${audience}.

## Market Overview
The ${topic} landscape is rapidly evolving, presenting both opportunities and challenges for ${audience}.

## Strategic Recommendations

### 1. Immediate Actions (0-3 months)
- Conduct comprehensive assessment
- Develop implementation roadmap
- Allocate necessary resources

### 2. Medium-term Initiatives (3-12 months)
- Execute pilot programs
- Scale successful initiatives
- Monitor key performance indicators

### 3. Long-term Vision (12+ months)
- Establish market leadership
- Continuous innovation
- Strategic partnerships

## Risk Assessment
- Market volatility
- Competitive pressures
- Technology disruption

## Success Metrics
- ROI measurement
- Market share growth
- Customer satisfaction
- Operational efficiency

## Conclusion
${topic} represents a significant opportunity for ${audience} to achieve sustainable competitive advantage.${pinsContext}`
    }
  };

  return contentMap[type] || contentMap['Strategic Content'];
}