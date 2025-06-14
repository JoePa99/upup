import { getCompanyContext } from '../../utils/knowledge-helper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fieldName, fieldType, existingFormData, generatorType } = req.body;

    if (!fieldName || !fieldType || !generatorType) {
      return res.status(400).json({
        message: 'Missing required fields: fieldName, fieldType, generatorType'
      });
    }

    // Get company context for informed suggestions
    const companyContext = await getCompanyContext(fieldName, req);
    
    console.log('=== AI ASSIST DEBUG ===');
    console.log('Field name:', fieldName);
    console.log('Generator type:', generatorType);
    console.log('Knowledge items found:', companyContext.relevantKnowledge.length);
    console.log('Knowledge context length:', companyContext.companyContext.length);
    console.log('Has knowledge base:', companyContext.relevantKnowledge.length > 0);
    
    // Generate AI suggestions
    const suggestions = await generateAISuggestions(
      fieldName, 
      fieldType, 
      existingFormData, 
      generatorType, 
      companyContext
    );

    return res.status(200).json({
      success: true,
      data: {
        suggestions,
        fieldName,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI assist error:', error);
    return res.status(500).json({
      message: 'AI assist failed',
      error: error.message
    });
  }
}

async function generateAISuggestions(fieldName, fieldType, existingFormData, generatorType, companyContext) {
  try {
    const { tenantInfo, companyContext: knowledgeContext, relevantKnowledge } = companyContext;
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback suggestions');
      return getFallbackSuggestions(fieldName, fieldType, generatorType);
    }
    
    // Build context from existing form data
    const formContext = buildFormContext(existingFormData, generatorType);
    
    // Include company knowledge if available
    const knowledgeSection = relevantKnowledge.length > 0 
      ? `\n\nCompany Knowledge (use this to inform suggestions):\n${knowledgeContext}`
      : '';
    
    // Determine company focus
    const hasKnowledgeBase = relevantKnowledge.length > 0;
    const focusCompany = hasKnowledgeBase ? 'the company from the knowledge base' : tenantInfo.companyName;
    
    const prompt = hasKnowledgeBase ? 
      `Generate 4-5 specific, actionable suggestions for the "${fieldName}" field in a ${generatorType} generator.

COMPANY KNOWLEDGE BASE - USE THIS INFORMATION:
${knowledgeSection}

Current form context:
${formContext}

Field details:
- Field name: ${fieldName}
- Field type: ${fieldType}
- Generator type: ${generatorType}

CRITICAL REQUIREMENTS:
1. Generate suggestions EXCLUSIVELY for the company described in the knowledge base above
2. Use specific details, products, services, or information from the knowledge base
3. DO NOT use generic suggestions - be specific to this company
4. Consider the existing form data when making suggestions
5. Each suggestion should be concise (1-2 sentences max)
6. Make suggestions actionable and specific to ${generatorType}
7. Return ONLY a JSON array of strings, no other text

Format: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]` :
      
      `Generate 4-5 specific, actionable suggestions for the "${fieldName}" field in a ${generatorType} generator.

Company: ${tenantInfo.companyName}
Industry: ${tenantInfo.industry}
Values: ${tenantInfo.values}

Current form context:
${formContext}

Field details:
- Field name: ${fieldName}
- Field type: ${fieldType}
- Generator type: ${generatorType}

Requirements:
1. Generate 4-5 specific, relevant suggestions for ${tenantInfo.companyName}
2. Make suggestions relevant to the company context above
3. Consider the existing form data when making suggestions
4. Each suggestion should be concise (1-2 sentences max)
5. Make suggestions actionable and specific to ${generatorType}
6. Return ONLY a JSON array of strings, no other text

Format: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]`;

    console.log('Making OpenAI API call for AI assist...');
    console.log('Has knowledge base:', hasKnowledgeBase);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');
    
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
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    try {
      // Parse the JSON response
      const suggestions = JSON.parse(content.trim());
      return Array.isArray(suggestions) ? suggestions : getFallbackSuggestions(fieldName, fieldType, generatorType);
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError);
      return getFallbackSuggestions(fieldName, fieldType, generatorType);
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getFallbackSuggestions(fieldName, fieldType, generatorType);
  }
}

function buildFormContext(existingFormData, generatorType) {
  if (!existingFormData) return 'No existing form data';
  
  const contextParts = [];
  
  // Add relevant form fields based on generator type
  switch (generatorType) {
    case 'content':
      if (existingFormData.contentTopic) contextParts.push(`Topic: ${existingFormData.contentTopic}`);
      if (existingFormData.contentType) contextParts.push(`Type: ${existingFormData.contentType}`);
      if (existingFormData.contentAudience) contextParts.push(`Audience: ${existingFormData.contentAudience}`);
      break;
    case 'growth':
      if (existingFormData.growthFocus) contextParts.push(`Focus: ${existingFormData.growthFocus}`);
      if (existingFormData.timeHorizon) contextParts.push(`Timeline: ${existingFormData.timeHorizon}`);
      break;
    case 'market':
      if (existingFormData.analysisFocus) contextParts.push(`Analysis: ${existingFormData.analysisFocus}`);
      if (existingFormData.marketScope) contextParts.push(`Scope: ${existingFormData.marketScope}`);
      break;
    case 'customer':
      if (existingFormData.connectionGoal) contextParts.push(`Goal: ${existingFormData.connectionGoal}`);
      if (existingFormData.customerSegment) contextParts.push(`Segment: ${existingFormData.customerSegment}`);
      break;
    case 'free-write':
      if (existingFormData.prompt) contextParts.push(`Prompt: ${existingFormData.prompt}`);
      if (existingFormData.useKnowledgeBase !== undefined) contextParts.push(`Knowledge Base: ${existingFormData.useKnowledgeBase ? 'Enabled' : 'Disabled'}`);
      if (existingFormData.creativity) contextParts.push(`Creativity: ${Math.round(existingFormData.creativity * 100)}%`);
      break;
  }
  
  return contextParts.length > 0 ? contextParts.join(', ') : 'No relevant form context';
}

function getFallbackSuggestions(fieldName, fieldType, generatorType) {
  const suggestions = {
    content: {
      contentTopic: [
        'customer retention strategies',
        'holiday marketing campaigns', 
        'brand storytelling techniques',
        'competitive differentiation',
        'product launch strategy'
      ],
      contentAudience: [
        'Professional artists and designers',
        'Art students and educators', 
        'Creative agencies and studios',
        'Corporate design teams',
        'Independent creative professionals'
      ],
      additionalContext: [
        'Focus on professional tone with industry expertise',
        'Include actionable insights and practical tips',
        'Emphasize quality and craftsmanship',
        'Target decision-makers in creative industries',
        'Highlight premium value proposition'
      ]
    },
    growth: {
      growthConstraints: [
        'Limited marketing budget requiring organic growth strategies',
        'Small team capacity needing scalable solutions',
        'Seasonal demand fluctuations in creative markets',
        'Supply chain dependencies for physical products',
        'Need to maintain premium brand positioning'
      ],
      additionalContext: [
        'Focus on sustainable growth strategies',
        'Emphasize premium market positioning',
        'Consider seasonal business cycles',
        'Prioritize customer lifetime value',
        'Balance growth with brand integrity'
      ]
    },
    market: {
      specificCompetitors: [
        'Faber-Castell premium art supplies',
        'Pilot Corporation professional pens',
        'Prismacolor art materials',
        'Copic marker systems',
        'Sakura creative tools'
      ],
      additionalContext: [
        'Focus on premium market segment analysis',
        'Consider professional vs. hobbyist markets',
        'Analyze digital vs. traditional tool trends',
        'Evaluate education market opportunities',
        'Study brand loyalty patterns in creative industries'
      ]
    },
    customer: {
      customerSegment: [
        'Professional artists and illustrators',
        'Design students and art educators',
        'Creative agencies and design studios', 
        'Architecture and technical drawing professionals',
        'Hobbyist creators and art enthusiasts'
      ],
      currentChallenges: [
        'High customer acquisition costs in niche markets',
        'Seasonal sales variations affecting cash flow',
        'Competition from digital design tools',
        'Building relationships with retail partners',
        'Maintaining brand awareness in new markets'
      ],
      additionalContext: [
        'Focus on building creative community connections',
        'Emphasize product quality and reliability',
        'Consider professional workflow integration',
        'Target educational institution partnerships',
        'Develop influencer and artist relationships'
      ]
    },
    'free-write': {
      prompt: [
        'The future of customer relationships in a digital-first world',
        'What innovation really means in traditional industries',
        'The psychology behind premium brand loyalty', 
        'How authentic storytelling changes everything',
        'Why quality craftsmanship still matters today'
      ],
      additionalContext: [
        'Write in a conversational, approachable tone',
        'Focus on emotional connection and human insights',
        'Use storytelling elements and vivid imagery',
        'Target thought leaders and industry innovators',
        'Blend practical wisdom with creative thinking'
      ]
    }
  };
  
  return suggestions[generatorType]?.[fieldName] || [
    'Enhance customer experience and satisfaction',
    'Improve operational efficiency and processes', 
    'Strengthen brand positioning and awareness',
    'Expand market reach and customer base',
    'Optimize product offerings and value proposition'
  ];
}