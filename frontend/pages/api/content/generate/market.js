export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { analysisFocus, marketScope, specificCompetitors } = req.body;

    if (!analysisFocus || !marketScope) {
      return res.status(400).json({
        message: 'Missing required fields: analysisFocus, marketScope'
      });
    }

    // Generate content with OpenAI
    const aiContent = await generateMarketContent(analysisFocus, marketScope, specificCompetitors);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisFocus,
          marketScope,
          competitors: specificCompetitors || 'general market competitors'
        }
      }
    });

  } catch (error) {
    console.error('Market insights generation error:', error);
    return res.status(500).json({
      message: 'Market insights generation failed',
      error: error.message
    });
  }
}

async function generateMarketContent(analysisFocus, marketScope, specificCompetitors) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `Market Analysis: ${analysisFocus} - ${marketScope}`,
        content: `Market analysis focusing on ${analysisFocus} within ${marketScope} scope. Competitors considered: ${specificCompetitors || 'general market competitors'}. This analysis would provide comprehensive insights into market trends, competitive landscape, and strategic opportunities.`
      };
    }
    
    const prompt = `Generate a comprehensive market analysis report focusing on ${analysisFocus} with a ${marketScope} scope.

Market Analysis Context:
- Analysis Focus: ${analysisFocus}
- Market Scope: ${marketScope}
- Specific Competitors: ${specificCompetitors || 'General market competitors'}

Requirements:
- Professional business analysis language
- Data-driven insights and market trends
- Competitive landscape analysis
- Strategic recommendations and actionable insights
- Market opportunities and threats
- Customer behavior patterns and preferences
- Length: 500-700 words
- Include specific metrics, percentages, and market data where relevant

Structure the analysis with clear sections covering:
1. Market Overview and Current Trends
2. Competitive Landscape Analysis
3. Customer Behavior and Preferences
4. Strategic Opportunities and Recommendations
5. Risk Assessment and Mitigation

Format: Return only the market analysis content, well-structured with clear headings and professional business language.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `Market Analysis: ${analysisFocus} - ${marketScope}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback content
    return {
      title: `Market Analysis: ${analysisFocus} - ${marketScope}`,
      content: `Market analysis focusing on ${analysisFocus} within ${marketScope} scope. Competitors considered: ${specificCompetitors || 'general market competitors'}. This analysis would provide comprehensive insights into market trends, competitive landscape, and strategic opportunities.`
    };
  }
}