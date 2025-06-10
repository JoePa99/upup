import { getCompanyContext } from '../../../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { templateType, clientName, proposalType, requirements } = req.body;

    if (!templateType) {
      return res.status(400).json({
        message: 'Missing required field: templateType'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(templateType + ' ' + (clientName || ''), req);

    // Generate content with OpenAI
    const aiContent = await generateSalesContent(templateType, clientName, proposalType, requirements, companyContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          templateType,
          clientName: clientName || 'Prospect',
          proposalType: proposalType || 'Business proposal',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0,
          knowledgeItems: companyContext.relevantKnowledge.length,
          knowledgeSourcesUsed: companyContext.relevantKnowledge.map(k => k.title)
        }
      }
    });

  } catch (error) {
    console.error('Sales template generation error:', error);
    return res.status(500).json({
      message: 'Sales template generation failed',
      error: error.message
    });
  }
}

async function generateSalesContent(templateType, clientName, proposalType, requirements, companyContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${templateType}: ${clientName || 'Prospect'}`,
        content: `Sales ${templateType} from ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} for ${clientName || 'prospect company'}. Type: ${proposalType || 'business proposal'}. Requirements: ${requirements || 'Standard business requirements'}. This document would include professional sales content tailored to your specific needs and requirements.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform the sales document):\n${knowledgeContext}`
      : '';
    
    // If we have knowledge base content, make the prompt ONLY about that company
    const prompt = hasKnowledgeBase ? 
      `Generate a professional ${templateType}. USE THE COMPANY KNOWLEDGE BASE INFORMATION TO MAKE THIS SPECIFIC AND RELEVANT.

🎯 COMPANY KNOWLEDGE BASE - USE THIS INFORMATION:
${knowledgeSection}

📋 SALES DOCUMENT DETAILS:
- Template Type: ${templateType}
- Client/Prospect: ${clientName || 'Prospect Company'}
- Proposal Type: ${proposalType || 'New Business'}
- Key Requirements: ${requirements || 'Standard sales proposal requirements'}

💼 FORMATTING REQUIREMENTS:
- Use clear headings and numbered/bulleted sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Our Solution", "Benefits", etc.
- Make each paragraph focused on one main topic
- Use bullet points for benefits, features, and key points

💼 CONTENT REQUIREMENTS:
- Base the sales document on the company described in the knowledge base above
- Use specific company services, products, and value propositions from the knowledge base
- Reference the company's actual experience, case studies, or success stories where appropriate
- Compelling value propositions and benefits based on company strengths from knowledge base
- Professional business language with clear call-to-action and next steps
- Length: 500-800 words

🎯 KNOWLEDGE BASE INTEGRATION:
- Reference specific company information from the knowledge base
- Tailor sales content to match the company's actual services and capabilities
- Include company-specific differentiators or success stories mentioned in the knowledge base
- Use company's unique value propositions and competitive advantages

STRUCTURE EXAMPLE:
📚 This document incorporates specific information from your company knowledge base.

# [PROPOSAL TITLE]

## Executive Summary
[Clear paragraph about the proposal overview]

## Our Solution
[Paragraph describing the solution]

## Key Benefits
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

## Next Steps
[Clear paragraph with call-to-action]

Format: Return only the sales document content, well-structured with clear headings and professional formatting.` :
      `Generate a professional ${templateType} from ${tenantInfo.companyName} for a client named "${clientName || 'the prospect'}" for a ${proposalType || 'business proposal'}.

📋 SALES DOCUMENT DETAILS:
- Template Type: ${templateType}
- Our Company: ${tenantInfo.companyName}
- Client/Prospect: ${clientName || 'Prospect Company'}
- Proposal Type: ${proposalType || 'New Business'}
- Key Requirements: ${requirements || 'Standard sales proposal requirements'}

💼 FORMATTING REQUIREMENTS:
- Use clear headings and numbered/bulleted sections
- Break content into logical paragraphs - NO long run-on blocks of text
- Use proper spacing between sections and paragraphs
- Include section headers like "Executive Summary", "Our Solution", "Benefits", etc.
- Make each paragraph focused on one main topic
- Use bullet points for benefits, features, and key points

💼 CONTENT REQUIREMENTS:
- Professional business language appropriate for sales communications
- Compelling value propositions and benefits
- Clear call-to-action and next steps
- Industry best practices for sales documents
- Length: 500-800 words
- Include specific sections relevant to the template type

STRUCTURE EXAMPLE:
# [PROPOSAL TITLE]

## Executive Summary
[Clear paragraph about the proposal overview]

## Our Solution
[Paragraph describing the solution]

## Key Benefits
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

## Next Steps
[Clear paragraph with call-to-action]

Format: Return only the sales document content, well-structured with clear headings and professional formatting.`;

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
      title: `${templateType}: ${clientName || 'Prospect'}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    // Fallback content
    return {
      title: `${templateType}: ${clientName || 'Prospect'}`,
      content: `Sales ${templateType} from ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} for ${clientName || 'prospect company'}. Type: ${proposalType || 'business proposal'}. Requirements: ${requirements || 'Standard business requirements'}. This document would include professional sales content tailored to your specific needs and requirements.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}