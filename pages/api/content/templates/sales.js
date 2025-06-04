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
          contextUsed: companyContext.relevantKnowledge.length > 0
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
      `Generate a professional ${templateType} from the company described in the knowledge base for a client named "${clientName || 'the prospect'}" for a ${proposalType || 'business proposal'}.

FOCUS COMPANY: The company described in the knowledge base below (IGNORE any other company names).

${knowledgeSection}

MANDATORY INSTRUCTIONS:
1. Write sales document ONLY for the company mentioned in the knowledge base above
2. IGNORE any tenant company name like "${tenantInfo.companyName}" - focus exclusively on the knowledge base company
3. Use the specific company details from the knowledge base to create targeted sales content

Business context:
- Template Type: ${templateType}
- Our Company: The company from the knowledge base
- Client/Prospect: ${clientName || 'Prospect Company'}
- Proposal Type: ${proposalType || 'New Business'}
- Key Requirements: ${requirements || 'Standard sales proposal requirements'}

Requirements:
- Professional business language appropriate for the knowledge base company
- Use the company knowledge base information to make sales content highly specific and relevant
- Compelling value propositions and benefits based on company strengths
- Clear call-to-action and next steps
- Industry best practices for sales documents
- Length: 500-800 words
- Include specific sections relevant to the template type

Format: Return only the sales document content, well-structured with clear headings and professional formatting.` :
      `Generate a professional ${templateType} from ${tenantInfo.companyName} for a client named "${clientName || 'the prospect'}" for a ${proposalType || 'business proposal'}.

Business context:
- Template Type: ${templateType}
- Our Company: ${tenantInfo.companyName}
- Client/Prospect: ${clientName || 'Prospect Company'}
- Proposal Type: ${proposalType || 'New Business'}
- Key Requirements: ${requirements || 'Standard sales proposal requirements'}

Requirements:
- Professional business language appropriate for sales communications
- Compelling value propositions and benefits
- Clear call-to-action and next steps
- Industry best practices for sales documents
- Length: 500-800 words
- Include specific sections relevant to the template type

Format: Return only the sales document content, well-structured with clear headings and professional formatting.`;

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