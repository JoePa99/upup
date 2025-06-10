import { getCompanyContext } from '../../../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { connectionGoal, customerSegment, currentChallenges, additionalContext } = req.body;

    if (!connectionGoal || !customerSegment) {
      return res.status(400).json({
        message: 'Missing required fields: connectionGoal, customerSegment'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(connectionGoal + ' ' + customerSegment, req);

    // Generate content with OpenAI
    const aiContent = await generateCustomerContent(connectionGoal, customerSegment, currentChallenges, companyContext, additionalContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          connectionGoal,
          customerSegment,
          challenges: currentChallenges || 'general challenges',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Customer analysis generation error:', error);
    return res.status(500).json({
      message: 'Customer analysis generation failed',
      error: error.message
    });
  }
}

async function generateCustomerContent(connectionGoal, customerSegment, currentChallenges, companyContext, additionalContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${hasKnowledgeBase ? 'Customer Strategy' : tenantInfo.companyName + ' Customer Strategy'}: ${connectionGoal}`,
        content: `Customer connection strategy for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${connectionGoal} for ${customerSegment} segment. Current challenges: ${currentChallenges || 'general customer relationship challenges'}. This analysis would provide comprehensive insights into customer engagement and retention strategies.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
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
      `Generate a comprehensive customer connection strategy for ${connectionGoal} targeting ${customerSegment}.

🎯 COMPANY KNOWLEDGE BASE - USE THIS INFORMATION:
${knowledgeSection}

📋 STRATEGY DETAILS:
- Connection Goal: ${connectionGoal}
- Customer Segment: ${customerSegment}
- Current Challenges: ${currentChallenges || 'General customer relationship challenges'}
${additionalContext ? `- Additional Requirements: ${additionalContext}` : ''}

📝 FORMATTING REQUIREMENTS:
- Use clear headings and numbered sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Customer Analysis", "Strategy", etc.
- Make each paragraph focused on one main topic
- Use bullet points for recommendations, tactics, and metrics

🎯 CONTENT REQUIREMENTS:
- Professional marketing and business analysis language specific to the knowledge base company
- Use the company knowledge base information to make strategy highly specific and relevant
- Customer-centric insights and behavioral patterns
- Actionable customer intelligence and recommendations
- Demographic, psychographic, and behavioral analysis
- Customer engagement tactics and relationship building
- Retention strategies and loyalty programs
- Length: 600-800 words
- Include specific tactics, implementation steps, and measurable outcomes

STRUCTURE EXAMPLE:
📚 This strategy incorporates specific information from your company knowledge base.

# Customer Connection Strategy

## Executive Summary
[Clear paragraph about the strategy overview]

## Customer Analysis
[Paragraph about target segment analysis]

## Engagement Strategy
### Key Tactics:
• [Tactic 1]
• [Tactic 2]
• [Tactic 3]

## Implementation Plan
[Clear paragraphs with actionable steps]

## Success Metrics
[Measurement approaches]

Format: Return only the customer strategy content, well-structured with clear headings and actionable recommendations.${additionalContextSection}` :
      `Generate a comprehensive customer connection strategy for ${connectionGoal} targeting ${customerSegment}.

📋 COMPANY CONTEXT:
- Company: ${tenantInfo.companyName}
- Industry: ${tenantInfo.industry}
- Size: ${tenantInfo.size}
- Connection Goal: ${connectionGoal}
- Customer Segment: ${customerSegment}
- Current Challenges: ${currentChallenges || 'General customer relationship challenges'}

📝 FORMATTING REQUIREMENTS:
- Use clear headings and numbered sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Customer Analysis", "Strategy", etc.
- Make each paragraph focused on one main topic
- Use bullet points for recommendations, tactics, and metrics

🎯 CONTENT REQUIREMENTS:
- Professional marketing and business analysis language specific to ${tenantInfo.companyName}
- Customer-centric insights and behavioral patterns
- Actionable customer intelligence and recommendations
- Demographic, psychographic, and behavioral analysis
- Customer engagement tactics and relationship building
- Retention strategies and loyalty programs
- Length: 600-800 words
- Include specific tactics, implementation steps, and measurable outcomes

STRUCTURE EXAMPLE:
# Customer Connection Strategy

## Executive Summary
[Clear paragraph about the strategy overview]

## Customer Analysis
[Paragraph about target segment analysis]

## Engagement Strategy
### Key Tactics:
• [Tactic 1]
• [Tactic 2]
• [Tactic 3]

## Implementation Plan
[Clear paragraphs with actionable steps]

## Success Metrics
[Measurement approaches]

Structure should include:
- Understanding the customer segment and their needs
- Specific strategies for ${tenantInfo.companyName} to achieve the connection goal
- Implementation tactics and timeline
- Success metrics and measurement approaches${additionalContext ? `
- Follow these additional requirements: ${additionalContext}` : ''}

Format: Return only the customer strategy content, well-structured with clear headings and actionable recommendations.${additionalContextSection}`;

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
        max_tokens: 1300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `${hasKnowledgeBase ? 'Customer Strategy' : tenantInfo.companyName + ' Customer Strategy'}: ${connectionGoal}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    // Fallback content
    return {
      title: `${hasKnowledgeBase ? 'Customer Strategy' : tenantInfo.companyName + ' Customer Strategy'}: ${connectionGoal}`,
      content: `Customer connection strategy for ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} focusing on ${connectionGoal} for ${customerSegment} segment. Current challenges: ${currentChallenges || 'general customer relationship challenges'}. This analysis would provide comprehensive insights into customer engagement and retention strategies.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}

