const { generateAIContent } = require('../services/ai-service');
const { logUsage } = require('../services/usage-service');

const contentController = {
  // Generate strategic content
  async generateContent(req, res) {
    try {
      const { contentTopic, contentType, contentAudience } = req.body;
      const tenantId = req.user.tenantId;

      // Validate required fields
      if (!contentTopic || !contentType || !contentAudience) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: contentTopic, contentType, contentAudience'
        });
      }

      // Generate AI content
      const prompt = `Generate strategic business content about "${contentTopic}" for ${contentType} targeting "${contentAudience}". 
      
      Focus on:
      - Building authentic customer relationships
      - Trust-building strategies
      - Quality over quantity approach
      - Competitive differentiation
      - Long-term value creation
      
      Write in a professional, strategic tone with actionable insights. Make it specific to the art supply/creative industry when possible.
      
      Length: 200-300 words with clear, complete sentences that can be easily parsed.`;

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 500,
        temperature: 0.7
      });

      // Log usage
      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'content_generation', 1);

      // Return the generated content
      res.json({
        success: true,
        data: {
          content: generatedText,
          title: `Strategic Content: ${contentTopic}`,
          metadata: {
            contentType,
            contentAudience,
            generatedAt: new Date().toISOString(),
            wordCount: generatedText.split(' ').length
          }
        }
      });

    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate content',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Generate growth opportunities
  async generateGrowthOpportunities(req, res) {
    try {
      const { growthFocus, timeHorizon, growthConstraints } = req.body;
      const tenantId = req.user.tenantId;

      // Validate required fields
      if (!growthFocus || !timeHorizon) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: growthFocus, timeHorizon'
        });
      }

      const prompt = `Analyze growth opportunities for a premium art supply company focusing on "${growthFocus}" within "${timeHorizon}".
      
      Current constraints: ${growthConstraints || 'None specified'}
      
      Provide strategic recommendations that:
      - Leverage premium brand positioning
      - Consider market trends in creative industries
      - Address specific constraints mentioned
      - Include actionable implementation ideas
      - Focus on sustainable growth strategies
      
      Write in a strategic consulting tone with specific examples and market insights.`;

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 600,
        temperature: 0.7
      });

      // Log usage
      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'growth_analysis', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: `Growth Opportunities: ${growthFocus}`,
          metadata: {
            growthFocus,
            timeHorizon,
            growthConstraints,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error generating growth opportunities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate growth opportunities',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Generate market insights
  async generateMarketInsights(req, res) {
    try {
      const { analysisFocus, marketScope, specificCompetitors } = req.body;
      const tenantId = req.user.tenantId;

      if (!analysisFocus || !marketScope) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: analysisFocus, marketScope'
        });
      }

      const prompt = `Provide market analysis focusing on "${analysisFocus}" for "${marketScope}" in the premium art supply industry.
      
      Competitors to consider: ${specificCompetitors || 'General market competitors'}
      
      Include insights on:
      - Customer behavior patterns
      - Market trends and opportunities
      - Competitive landscape analysis
      - Pricing strategies
      - Market positioning recommendations
      
      Provide data-driven insights with specific recommendations for a premium art supply brand.`;

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 550,
        temperature: 0.6
      });

      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'market_analysis', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: `Market Analysis: ${analysisFocus}`,
          metadata: {
            analysisFocus,
            marketScope,
            specificCompetitors,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error generating market insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate market insights',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Generate customer connection strategies
  async generateCustomerConnection(req, res) {
    try {
      const { connectionGoal, customerSegment, currentChallenges } = req.body;
      const tenantId = req.user.tenantId;

      if (!connectionGoal || !customerSegment) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: connectionGoal, customerSegment'
        });
      }

      const prompt = `Develop customer relationship strategies to "${connectionGoal}" for "${customerSegment}" in the creative industry.
      
      Current challenges: ${currentChallenges || 'None specified'}
      
      Focus on:
      - Building emotional connections with creative professionals
      - Retention and loyalty strategies
      - Customer journey optimization
      - Value-added service opportunities
      - Community building approaches
      
      Provide actionable strategies that align with premium brand positioning.`;

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 500,
        temperature: 0.7
      });

      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'customer_analysis', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: `Customer Strategy: ${connectionGoal}`,
          metadata: {
            connectionGoal,
            customerSegment,
            currentChallenges,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error generating customer connection strategies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate customer connection strategies',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = contentController;