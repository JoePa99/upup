// Content generation API endpoint in Next.js pages/api
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

    // Generate mock content based on input
    const mockContent = generateMockContent(contentTopic, contentType, contentAudience, pins);

    return res.status(200).json({
      success: true,
      data: {
        content: mockContent.content,
        title: mockContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          contentType,
          audience: contentAudience,
          topic: contentTopic,
          pinsUsed: pins.length,
          wordCount: mockContent.content.split(' ').length
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

function generateMockContent(topic, type, audience, pins) {
  const pinsContext = pins.length > 0 
    ? `\n\nBased on your pinned content: ${pins.map(p => p.content).join(', ')}`
    : '';

  const contentMap = {
    'Blog Post': {
      title: `The Ultimate Guide to ${topic}`,
      content: `# The Ultimate Guide to ${topic}

## Introduction
In today's rapidly evolving business landscape, ${topic} has become increasingly important for ${audience}. This comprehensive guide will walk you through everything you need to know.

## Why ${topic} Matters
Understanding ${topic} is crucial because:
- It drives business growth and innovation
- It helps ${audience} achieve their goals more effectively
- It provides competitive advantages in the market

## Key Strategies
Here are the top strategies for implementing ${topic}:

1. **Start with Clear Objectives**
   Define what you want to achieve with ${topic}

2. **Develop a Structured Approach**
   Create a step-by-step plan tailored to ${audience}

3. **Monitor and Optimize**
   Continuously track performance and make improvements

## Best Practices
- Focus on value creation
- Maintain consistency in your approach
- Stay updated with industry trends
- Engage with your target audience regularly

## Conclusion
${topic} is a powerful tool that can transform how ${audience} operate. By following the strategies outlined in this guide, you'll be well-positioned for success.${pinsContext}`
    },
    
    'Email Campaign': {
      title: `${topic} Email Campaign for ${audience}`,
      content: `Subject: Transform Your Business with ${topic}

Dear ${audience},

Are you looking to revolutionize your approach to ${topic}? You're in the right place.

${topic} has become a game-changer for businesses like yours. Here's why:

✓ Increased efficiency and productivity
✓ Better customer engagement
✓ Improved ROI and growth metrics

**What You'll Get:**
- Proven strategies that work
- Step-by-step implementation guide
- Real-world case studies

**Take Action Today:**
Don't let your competitors get ahead. Start implementing ${topic} strategies now.

[Call-to-Action Button: Get Started]

Best regards,
The UPUP Team

P.S. Limited time offer - Act now to secure your competitive advantage!${pinsContext}`
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