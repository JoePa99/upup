// Helper function to get company context
async function getCompanyContext(query, req) {
  try {
    // Import auth helpers
    const { getUserFromRequest } = require('../../../../utils/auth-helpers');
    const user = await getUserFromRequest(req);
    
    if (!user || !user.tenantId) {
      console.log('No authenticated user found, using fallback context');
      return {
        tenantInfo: {
          companyName: 'Your Company',
          industry: 'Professional Services',
          size: 'Medium Business'
        },
        companyContext: '',
        relevantKnowledge: []
      };
    }

    // Call the knowledge API directly to get company knowledge
    const knowledgeUrl = `${req.headers.origin || 'http://localhost:3000'}/api/knowledge/company`;
    const knowledgeResponse = await fetch(knowledgeUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    });
    
    let relevantKnowledge = [];
    let companyContext = '';
    
    if (knowledgeResponse.ok) {
      const knowledgeData = await knowledgeResponse.json();
      const knowledge = knowledgeData.data?.knowledge || [];
      
      // Filter knowledge relevant to the query
      relevantKnowledge = knowledge.filter(item => {
        const searchText = `${item.title} ${item.content || ''}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return searchText.includes(queryLower) || 
               queryLower.split(' ').some(word => searchText.includes(word));
      }).slice(0, 3); // Limit to top 3 relevant items
      
      // Create context string from relevant knowledge
      companyContext = relevantKnowledge.map(item => 
        `${item.title}: ${(item.content || '').substring(0, 300)}...`
      ).join('\n\n');
    }

    return {
      tenantInfo: {
        companyName: user.tenantName || 'Your Company',
        industry: 'Professional Services',
        size: 'Medium Business'
      },
      companyContext,
      relevantKnowledge
    };
  } catch (error) {
    console.error('Error getting company context:', error);
    return {
      tenantInfo: {
        companyName: 'Your Company',
        industry: 'Professional Services',
        size: 'Medium Business'
      },
      companyContext: '',
      relevantKnowledge: []
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { growthFocus, timeHorizon, constraints } = req.body;

    if (!growthFocus || !timeHorizon) {
      return res.status(400).json({
        message: 'Missing required fields: growthFocus, timeHorizon'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(growthFocus, req);

    // Generate content with OpenAI
    const aiContent = await generateAIContent(growthFocus, timeHorizon, constraints, companyContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          growthFocus,
          timeHorizon,
          constraints: constraints || 'general constraints',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Growth strategy generation error:', error);
    return res.status(500).json({
      message: 'Growth strategy generation failed',
      error: error.message
    });
  }
}

async function generateAIContent(focus, timeframe, constraints, companyContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${tenantInfo.companyName} Growth Strategy: ${focus}`,
        content: `Growth opportunity analysis for ${tenantInfo.companyName} focusing on ${focus} with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform your strategy):\n${knowledgeContext}`
      : '';
    
    const prompt = `Generate a comprehensive growth strategy about ${focus} with a ${timeframe} timeline.
    
Company context:
- Company: ${tenantInfo.companyName}
- Industry: ${tenantInfo.industry}
- Size: ${tenantInfo.size}
- Growth Focus: ${focus}
- Timeline: ${timeframe}
- Constraints: ${constraints || 'Standard business environment'}${knowledgeSection}

Requirements:
- Professional business language
- Actionable strategic recommendations specific to ${tenantInfo.companyName}
- Use the company knowledge base information to make strategy more specific and relevant
- Specific tactics and implementation steps
- Measurable outcomes and KPIs
- Length: 400-600 words

Format: Return only the strategy content, well-structured with clear sections.`;

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
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `${tenantInfo.companyName} Growth Strategy: ${focus}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    // Fallback content
    return {
      title: `${tenantInfo.companyName} Growth Strategy: ${focus}`,
      content: `Growth opportunity analysis for ${tenantInfo.companyName} focusing on ${focus} with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}