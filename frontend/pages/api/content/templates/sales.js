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

    // Generate content with OpenAI
    const aiContent = await generateSalesContent(templateType, clientName, proposalType, requirements);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          templateType,
          clientName: clientName || 'Prospect',
          proposalType: proposalType || 'Business proposal'
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

async function generateSalesContent(templateType, clientName, proposalType, requirements) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `${templateType}: ${clientName || 'Prospect'}`,
        content: `Sales ${templateType} for ${clientName || 'prospect company'}. Type: ${proposalType || 'business proposal'}. Requirements: ${requirements || 'Standard business requirements'}. This document would include professional sales content tailored to your specific needs and requirements.`
      };
    }
    
    const prompt = `Generate a professional ${templateType} for a client named "${clientName || 'the prospect'}" for a ${proposalType || 'business proposal'}.

Business context:
- Template Type: ${templateType}
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
      title: `${templateType}: ${clientName || 'Prospect'}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback content
    return {
      title: `${templateType}: ${clientName || 'Prospect'}`,
      content: `Sales ${templateType} for ${clientName || 'prospect company'}. Type: ${proposalType || 'business proposal'}. Requirements: ${requirements || 'Standard business requirements'}. This document would include professional sales content tailored to your specific needs and requirements.`
    };
  }
}