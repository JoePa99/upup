const { getCompanyContext } = require('../../../../utils/knowledge-helper');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { templateType, partyName, projectDetails, specificTerms } = req.body;

    if (!templateType) {
      return res.status(400).json({
        message: 'Missing required field: templateType'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(templateType + ' ' + (partyName || ''), req);

    // Generate content with OpenAI
    const aiContent = await generateLegalContent(templateType, partyName, projectDetails, specificTerms, companyContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          templateType,
          partyName: partyName || 'Other Party',
          projectDetails: projectDetails || 'Business relationship',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Legal template generation error:', error);
    return res.status(500).json({
      message: 'Legal template generation failed',
      error: error.message
    });
  }
}

async function generateLegalContent(templateType, partyName, projectDetails, specificTerms, companyContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${templateType}: ${partyName || 'Legal Document'}`,
        content: `${templateType} document between ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} and ${partyName || 'Other Party'}. Project: ${projectDetails || 'Business relationship'}. Specific terms: ${specificTerms || 'Standard terms apply'}.\n\nIMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform the legal document):\n${knowledgeContext}`
      : '';
    
    // If we have knowledge base content, make the prompt ONLY about that company
    const prompt = hasKnowledgeBase ? 
      `Generate a professional ${templateType} legal document between the company described in the knowledge base and "${partyName || 'the other party'}" for ${projectDetails || 'a business relationship'}.

FOCUS COMPANY: The company described in the knowledge base below (IGNORE any other company names).

${knowledgeSection}

MANDATORY INSTRUCTIONS:
1. Write legal document ONLY for the company mentioned in the knowledge base above
2. IGNORE any tenant company name like "${tenantInfo.companyName}" - focus exclusively on the knowledge base company
3. Use the specific company details from the knowledge base to create targeted legal content

Legal context:
- Document Type: ${templateType}
- Our Company: The company from the knowledge base
- Other Party: ${partyName || 'Other Party'}
- Project/Relationship: ${projectDetails || 'Business relationship'}
- Specific Terms: ${specificTerms || 'Standard legal terms'}

Requirements:
- Professional legal language appropriate for the knowledge base company
- Use the company knowledge base information to make legal content highly specific and relevant
- Standard legal document structure with numbered sections
- Include appropriate disclaimers and legal protections
- Cover key areas like scope, responsibilities, termination, and governing law
- Length: 600-1000 words
- Include mandatory legal disclaimer about consulting qualified attorney

CRITICAL: Always include this disclaimer at the end:
"IMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement."

Format: Return only the legal document content, well-structured with clear sections and professional legal formatting.` :
      `Generate a professional ${templateType} legal document between ${tenantInfo.companyName} and "${partyName || 'the other party'}" for ${projectDetails || 'a business relationship'}.

Legal context:
- Document Type: ${templateType}
- Our Company: ${tenantInfo.companyName}
- Other Party: ${partyName || 'Other Party'}
- Project/Relationship: ${projectDetails || 'Business relationship'}
- Specific Terms: ${specificTerms || 'Standard legal terms'}

Requirements:
- Professional legal language appropriate for business agreements
- Standard legal document structure with numbered sections
- Include appropriate disclaimers and legal protections
- Cover key areas like scope, responsibilities, termination, and governing law
- Length: 600-1000 words
- Include mandatory legal disclaimer about consulting qualified attorney

CRITICAL: Always include this disclaimer at the end:
"IMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement."

Format: Return only the legal document content, well-structured with clear sections and professional legal formatting.`;

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
        max_tokens: 1400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `${templateType}: ${partyName || 'Legal Document'}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    // Fallback content
    return {
      title: `${templateType}: ${partyName || 'Legal Document'}`,
      content: `${templateType} document between ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName} and ${partyName || 'Other Party'}. Project: ${projectDetails || 'Business relationship'}. Specific terms: ${specificTerms || 'Standard terms apply'}.\n\nIMPORTANT: This template is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before using this agreement.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}