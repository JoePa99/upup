import { getCompanyContext } from '../../../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { growthFocus, timeHorizon, constraints, additionalContext } = req.body;

    if (!growthFocus || !timeHorizon) {
      return res.status(400).json({
        message: 'Missing required fields: growthFocus, timeHorizon'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(growthFocus, req);

    // Generate content with OpenAI
    const aiContent = await generateAIContent(growthFocus, timeHorizon, constraints, companyContext, additionalContext);

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

async function generateAIContent(focus, timeframe, constraints, companyContext, additionalContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${hasKnowledgeBase ? 'Growth Strategy' : tenantInfo.companyName + ' Growth Strategy'}: ${focus}`,
        content: `Growth opportunity analysis for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${focus} with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform your strategy):\n${knowledgeContext}`
      : '';
      
    // Include additional context if provided
    const additionalContextSection = additionalContext 
      ? `\n\nAdditional Requirements:\n${additionalContext}`
      : '';
    
    // If we have knowledge base content, make the prompt ONLY about that company
    const prompt = hasKnowledgeBase ? 
      `Generate a comprehensive growth strategy about ${focus} with a ${timeframe} timeline.

FOCUS COMPANY: The company described in the knowledge base below (IGNORE any other company names).

${knowledgeSection}

MANDATORY INSTRUCTIONS:
1. Write strategy ONLY about the company mentioned in the knowledge base above
2. IGNORE any tenant company name like "${tenantInfo.companyName}" - focus exclusively on the knowledge base company
3. Use the specific company details from the knowledge base to create targeted recommendations

Requirements:
- Professional business language
- Actionable strategic recommendations specific to the knowledge base company
- Use the company knowledge base information to make strategy highly specific and relevant
- Specific tactics and implementation steps
- Measurable outcomes and KPIs
- Length: 400-600 words${additionalContext ? `
- Follow these additional requirements: ${additionalContext}` : ''}

📝 FORMATTING REQUIREMENTS:
- Use clear headings and numbered sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Analysis", "Strategy", etc.
- Make each paragraph focused on one main topic
- Use bullet points for recommendations, tactics, and metrics

STRUCTURE EXAMPLE:
# [DOCUMENT TITLE]

## Executive Summary
[Clear paragraph about the overview]

## Analysis
[Paragraph about analysis]

## Key Recommendations
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]

## Implementation Plan
[Clear paragraphs with actionable steps]

Format: Return only the strategy content, well-structured with clear sections and proper formatting.${additionalContextSection}` :
      `Generate a comprehensive growth strategy about ${focus} with a ${timeframe} timeline.
    
Company context:
- Company: ${tenantInfo.companyName}
- Industry: ${tenantInfo.industry}
- Size: ${tenantInfo.size}
- Growth Focus: ${focus}
- Timeline: ${timeframe}
- Constraints: ${constraints || 'Standard business environment'}

Requirements:
- Professional business language
- Actionable strategic recommendations specific to ${tenantInfo.companyName}
- Specific tactics and implementation steps
- Measurable outcomes and KPIs
- Length: 400-600 words${additionalContext ? `
- Follow these additional requirements: ${additionalContext}` : ''}

📝 FORMATTING REQUIREMENTS:
- Use clear headings and numbered sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Analysis", "Strategy", etc.
- Make each paragraph focused on one main topic
- Use bullet points for recommendations, tactics, and metrics

STRUCTURE EXAMPLE:
# [DOCUMENT TITLE]

## Executive Summary
[Clear paragraph about the overview]

## Analysis
[Paragraph about analysis]

## Key Recommendations
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]

## Implementation Plan
[Clear paragraphs with actionable steps]

Format: Return only the strategy content, well-structured with clear sections and proper formatting.${additionalContextSection}`;

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
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `${hasKnowledgeBase ? 'Growth Strategy' : tenantInfo.companyName + ' Growth Strategy'}: ${focus}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    // Fallback content
    return {
      title: `${hasKnowledgeBase ? 'Growth Strategy' : tenantInfo.companyName + ' Growth Strategy'}: ${focus}`,
      content: `Growth opportunity analysis for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${focus} with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}