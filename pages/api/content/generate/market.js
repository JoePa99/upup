const { getCompanyContext } = require('../../../../utils/knowledge-helper');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { analysisFocus, marketScope, specificCompetitors, additionalContext } = req.body;

    if (!analysisFocus || !marketScope) {
      return res.status(400).json({
        message: 'Missing required fields: analysisFocus, marketScope'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(analysisFocus, req);

    // Generate content with OpenAI
    const aiContent = await generateMarketContent(analysisFocus, marketScope, specificCompetitors, companyContext, additionalContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisFocus,
          marketScope,
          competitors: specificCompetitors || 'general market competitors',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0
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

async function generateMarketContent(analysisFocus, marketScope, specificCompetitors, companyContext, additionalContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${hasKnowledgeBase ? 'Market Analysis' : tenantInfo.companyName + ' Market Analysis'}: ${analysisFocus}`,
        content: `Market analysis for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${analysisFocus} within ${marketScope} scope. Competitors considered: ${specificCompetitors || 'general market competitors'}. This analysis would provide comprehensive insights into market trends, competitive landscape, and strategic opportunities.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform your analysis):\n${knowledgeContext}`
      : '';
      
    // Include additional context if provided
    const additionalContextSection = additionalContext 
      ? `\n\nAdditional Requirements:\n${additionalContext}`
      : '';
    
    // If we have knowledge base content, make the prompt ONLY about that company
    const prompt = hasKnowledgeBase ? 
      `Generate a comprehensive market analysis report focusing on ${analysisFocus} with a ${marketScope} scope.

FOCUS COMPANY: The company described in the knowledge base below (IGNORE any other company names).

${knowledgeSection}

MANDATORY INSTRUCTIONS:
1. Write analysis ONLY about the company mentioned in the knowledge base above
2. IGNORE any tenant company name like "${tenantInfo.companyName}" - focus exclusively on the knowledge base company
3. Use the specific company details from the knowledge base to create targeted analysis

Requirements:
- Professional business analysis language specific to the knowledge base company
- Use the company knowledge base information to make analysis highly specific and relevant
- Data-driven insights and market trends
- Competitive landscape analysis
- Strategic recommendations and actionable insights
- Market opportunities and threats
- Customer behavior patterns and preferences
- Length: 500-700 words
- Include specific metrics, percentages, and market data where relevant${additionalContext ? `
- Follow these additional requirements: ${additionalContext}` : ''}

Structure the analysis with clear sections covering:
1. Market Overview and Current Trends
2. Competitive Landscape Analysis
3. Customer Behavior and Preferences
4. Strategic Opportunities and Recommendations for the knowledge base company
5. Risk Assessment and Mitigation

Format: Return only the market analysis content, well-structured with clear headings and professional business language.${additionalContextSection}` :
      `Generate a comprehensive market analysis report focusing on ${analysisFocus} with a ${marketScope} scope.

Company Context:
- Company: ${tenantInfo.companyName}
- Industry: ${tenantInfo.industry}
- Size: ${tenantInfo.size}
- Analysis Focus: ${analysisFocus}
- Market Scope: ${marketScope}
- Specific Competitors: ${specificCompetitors || 'General market competitors'}

Requirements:
- Professional business analysis language specific to ${tenantInfo.companyName}
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
4. Strategic Opportunities and Recommendations for ${tenantInfo.companyName}
5. Risk Assessment and Mitigation${additionalContext ? `
- Follow these additional requirements: ${additionalContext}` : ''}

Format: Return only the market analysis content, well-structured with clear headings and professional business language.${additionalContextSection}`;

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
      title: `${hasKnowledgeBase ? 'Market Analysis' : tenantInfo.companyName + ' Market Analysis'}: ${analysisFocus}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    // Fallback content
    return {
      title: `${hasKnowledgeBase ? 'Market Analysis' : tenantInfo.companyName + ' Market Analysis'}: ${analysisFocus}`,
      content: `Market analysis for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${analysisFocus} within ${marketScope} scope. Competitors considered: ${specificCompetitors || 'general market competitors'}. This analysis would provide comprehensive insights into market trends, competitive landscape, and strategic opportunities.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}