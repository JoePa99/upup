import { getCompanyContext } from '../../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, useKnowledgeBase, creativity, additionalContext } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        message: 'Missing required field: prompt'
      });
    }

    // Get company context if requested
    let companyContext = null;
    if (useKnowledgeBase) {
      companyContext = await getCompanyContext(prompt, req);
    }

    // Generate content with OpenAI
    const aiContent = await generateFreeWriteContent(
      prompt, 
      useKnowledgeBase, 
      creativity, 
      additionalContext, 
      companyContext
    );

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          prompt: prompt.substring(0, 100),
          useKnowledgeBase,
          creativity,
          contextUsed: useKnowledgeBase && companyContext?.relevantKnowledge?.length > 0,
          wordCount: aiContent.content.split(' ').length
        }
      }
    });

  } catch (error) {
    console.error('Free write generation error:', error);
    return res.status(500).json({
      message: 'Free write generation failed',
      error: error.message
    });
  }
}

async function generateFreeWriteContent(prompt, useKnowledgeBase, creativity, additionalContext, companyContext) {
  try {
    console.log('Generating free write content for:', { prompt, useKnowledgeBase, creativity });
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using mock content');
      return generateMockFreeWrite(prompt, useKnowledgeBase, creativity, additionalContext, companyContext);
    }
    
    // Build the prompt based on knowledge base usage
    let systemPrompt = '';
    let knowledgeSection = '';
    
    if (useKnowledgeBase && companyContext) {
      const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
      const hasKnowledgeBase = relevantKnowledge.length > 0;
      
      if (hasKnowledgeBase) {
        knowledgeSection = `\n\nCompany Knowledge Base Context:\n${knowledgeContext}`;
        systemPrompt = `You are a creative copywriter working with specific company knowledge. Write engaging, creative content that incorporates the company's context and knowledge base information.`;
      } else {
        systemPrompt = `You are a creative copywriter for ${tenantInfo.companyName}. Write engaging, creative content that reflects the company's values and industry focus.`;
      }
    } else {
      systemPrompt = `You are a creative copywriter. Write engaging, original content that explores the given prompt with creativity and insight.`;
    }
    
    // Include additional context if provided
    const additionalContextSection = additionalContext 
      ? `\n\nAdditional Context & Style Requirements:\n${additionalContext}`
      : '';
    
    const userPrompt = `Write creative copy based on this prompt: "${prompt}"

${knowledgeSection}${additionalContextSection}

📝 FORMATTING REQUIREMENTS:
- Break content into 3-4 short, punchy paragraphs with clear spacing
- Use varied sentence lengths and creative language  
- Make each paragraph focused and pin-able as individual insights
- Add proper paragraph breaks - NO wall of text
- Each paragraph should stand alone as a complete thought

📋 CONTENT REQUIREMENTS:
- Generate 200-400 words total
- Make it engaging and memorable
- Focus on ${creativity > 0.7 ? 'bold, experimental ideas' : creativity > 0.5 ? 'creative but practical concepts' : 'clear, reliable messaging'}
- Write in a ${creativity > 0.8 ? 'highly creative and unconventional' : creativity > 0.6 ? 'creative and engaging' : creativity > 0.4 ? 'balanced and professional' : 'conservative and straightforward'} style

STRUCTURE EXAMPLE:
[First paragraph - Hook/opening thought]

[Second paragraph - Core insight or development]  

[Third paragraph - Deeper exploration or implication]

[Fourth paragraph - Conclusion or call to action]

Return only the content with proper paragraph spacing - no extra formatting or explanations.`;

    console.log('Making OpenAI API call with creativity level:', creativity);
    
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
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 600,
        temperature: creativity, // Use creativity slider as temperature
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Failed to generate content';
    
    console.log('Free write content generated successfully, length:', content.length);
    
    return {
      title: `Free Write: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock content if API fails
    console.log('Falling back to mock content');
    return generateMockFreeWrite(prompt, useKnowledgeBase, creativity, additionalContext, companyContext);
  }
}

function generateMockFreeWrite(prompt, useKnowledgeBase, creativity, additionalContext, companyContext) {
  const creativityLevel = creativity > 0.7 ? 'experimental' : creativity > 0.5 ? 'creative' : 'balanced';
  
  let companyReference = '';
  if (useKnowledgeBase && companyContext) {
    const { tenantInfo, relevantKnowledge } = companyContext;
    const hasKnowledge = relevantKnowledge.length > 0;
    companyReference = hasKnowledge ? 
      'Drawing from your company knowledge base' : 
      `For ${tenantInfo.companyName}`;
  }
  
  const mockContent = `${companyReference ? companyReference + ': ' : ''}This is a ${creativityLevel} exploration of "${prompt}".

Every great idea starts with a simple spark. Your prompt opens doors to possibilities that conventional thinking might miss. Consider how this concept could transform not just what you do, but how you think about doing it.

The beauty of free writing lies in its ability to connect unexpected dots. When we approach "${prompt}" with fresh perspective, we discover relationships between ideas that create genuine innovation and authentic engagement.

What emerges from this creative process isn't just content—it's insight. The kind of understanding that shifts conversations, influences decisions, and creates lasting impact in your market.

${additionalContext ? `\nNote: Generated with ${creativityLevel} approach considering: ${additionalContext}` : ''}`;

  return {
    title: `Free Write: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
    content: mockContent
  };
}