import { getCompanyContext } from '../../../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { templateType, jobTitle, department, responsibilities } = req.body;

    if (!templateType) {
      return res.status(400).json({
        message: 'Missing required field: templateType'
      });
    }

    // Get company context for personalized content
    const companyContext = await getCompanyContext(templateType + ' ' + (jobTitle || ''), req);

    // Generate content with OpenAI
    const aiContent = await generateHRContent(templateType, jobTitle, department, responsibilities, companyContext);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          templateType,
          jobTitle: jobTitle || 'Position',
          department: department || 'General',
          companyName: companyContext.tenantInfo.companyName,
          contextUsed: companyContext.relevantKnowledge.length > 0,
          knowledgeItems: companyContext.relevantKnowledge.length,
          knowledgeSourcesUsed: companyContext.relevantKnowledge.map(k => k.title)
        }
      }
    });

  } catch (error) {
    console.error('HR template generation error:', error);
    return res.status(500).json({
      message: 'HR template generation failed',
      error: error.message
    });
  }
}

async function generateHRContent(templateType, jobTitle, department, responsibilities, companyContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Determine which company to focus on - prioritize knowledge base content
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${templateType}: ${jobTitle || 'HR Document'}`,
        content: `${templateType} for ${jobTitle || 'Position'} in ${department || 'Department'} at ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName}. This document would include comprehensive details based on your input: ${responsibilities || 'No additional details provided'}.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
      };
    }
    
    // Include company knowledge in the prompt if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge Base (use this to inform the HR document):\n${knowledgeContext}`
      : '';
    
    // If we have knowledge base content, make the prompt ONLY about that company
    const prompt = hasKnowledgeBase ? 
      `Generate a professional ${templateType}. USE THE COMPANY KNOWLEDGE BASE INFORMATION TO MAKE THIS SPECIFIC AND RELEVANT.

🎯 COMPANY KNOWLEDGE BASE - USE THIS INFORMATION:
${knowledgeSection}

📋 HR DOCUMENT DETAILS:
- Document Type: ${templateType}
- Job Title: ${jobTitle || 'Position'}
- Department: ${department || 'General'}
- Key Responsibilities: ${responsibilities || 'Standard job responsibilities'}

📝 REQUIREMENTS:
- Base the HR document on the company described in the knowledge base above
- Use specific company culture, values, and policies from the knowledge base
- Reference the company's actual business, mission, or values where appropriate
- Clear structure with relevant sections for the document type
- Include appropriate qualifications, skills, and requirements
- Use inclusive language and follow HR best practices
- Length: 500-800 words

🏢 KNOWLEDGE BASE INTEGRATION:
- Reference specific company information from the knowledge base
- Tailor HR content to match the company's culture and values
- Include company-specific benefits, policies, or practices mentioned in the knowledge base

Template-specific requirements:
${getTemplateSpecificRequirements(templateType)}

Include at the beginning: "📚 This document incorporates specific information from your company knowledge base."

Format: Return only the HR document content, well-structured with clear headings and professional formatting.` :
      `Generate a professional ${templateType} for a ${jobTitle || 'position'} in the ${department || 'general'} department.

HR context:
- Company: ${tenantInfo.companyName}
- Document Type: ${templateType}
- Job Title: ${jobTitle || 'Position'}
- Department: ${department || 'General'}
- Key Responsibilities: ${responsibilities || 'Standard job responsibilities'}

Requirements:
- Professional HR language appropriate for business documents
- Clear structure with relevant sections for the document type
- Include appropriate qualifications, skills, and requirements
- Cover compensation, benefits, and company culture where applicable
- Length: 500-800 words
- Use inclusive language and follow HR best practices
- Include relevant legal compliance considerations

Template-specific requirements:
${getTemplateSpecificRequirements(templateType)}

Format: Return only the HR document content, well-structured with clear headings and professional formatting.`;

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
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    return {
      title: `${templateType}: ${jobTitle || 'HR Document'}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    const { tenantInfo, companyContext: knowledgeContext } = companyContext;
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    // Fallback content
    return {
      title: `${templateType}: ${jobTitle || 'HR Document'}`,
      content: `${templateType} for ${jobTitle || 'Position'} in ${department || 'Department'} at ${hasKnowledgeBase ? 'the company' : tenantInfo.companyName}. This document would include comprehensive details based on your input: ${responsibilities || 'No additional details provided'}.${knowledgeContext ? `\n\nBased on company knowledge:\n${knowledgeContext}` : ''}`
    };
  }
}

function getTemplateSpecificRequirements(templateType) {
  const requirements = {
    'job-description': '- Include job summary, key responsibilities, required qualifications, preferred qualifications, and company benefits\n- Use action-oriented language for responsibilities\n- Include salary range if appropriate',
    'interview-questions': '- Include behavioral, technical, and situational questions\n- Provide sample answers or evaluation criteria\n- Include questions about company culture fit',
    'performance-review': '- Include goal setting, performance metrics, feedback sections\n- Use constructive language for improvement areas\n- Include career development planning',
    'employee-handbook': '- Cover policies, procedures, and company culture\n- Include legal compliance information\n- Use clear, accessible language for all employees',
    'onboarding-checklist': '- Include pre-arrival, first day, first week, and first month items\n- Cover equipment, training, and introductions\n- Include completion checkboxes and deadlines',
    'offer-letter': '- Include compensation details, start date, and key terms\n- Use formal but welcoming tone\n- Include next steps and contact information'
  };
  
  return requirements[templateType] || '- Follow standard HR document best practices';
}