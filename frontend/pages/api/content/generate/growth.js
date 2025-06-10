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

    // Generate content with OpenAI
    const aiContent = await generateAIContent(growthFocus, timeHorizon, constraints);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          growthFocus,
          timeHorizon,
          constraints: constraints || 'general constraints'
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

async function generateAIContent(focus, timeframe, constraints) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `Growth Strategy: ${focus}`,
        content: `Growth opportunity analysis for ${focus} focus with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.`
      };
    }
    
    const prompt = `Generate a comprehensive growth strategy about ${focus} with a ${timeframe} timeline.
    
Business context:
- Growth Focus: ${focus}
- Timeline: ${timeframe}
- Constraints: ${constraints || 'Standard business environment'}

Requirements:
- Professional business language
- Actionable strategic recommendations
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
        model: 'gpt-4o',
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
      title: `Growth Strategy: ${focus}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback content
    return {
      title: `Growth Strategy: ${focus}`,
      content: `Growth opportunity analysis for ${focus} focus with ${timeframe} timeline. Based on your constraints: ${constraints || 'standard business constraints'}, here are strategic recommendations for business expansion and revenue optimization.`
    };
  }
}