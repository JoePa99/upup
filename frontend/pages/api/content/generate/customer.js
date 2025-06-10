export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { connectionGoal, customerSegment, currentChallenges } = req.body;

    if (!connectionGoal || !customerSegment) {
      return res.status(400).json({
        message: 'Missing required fields: connectionGoal, customerSegment'
      });
    }

    // Generate content with OpenAI
    const aiContent = await generateCustomerContent(connectionGoal, customerSegment, currentChallenges);

    return res.status(200).json({
      success: true,
      data: {
        content: aiContent.content,
        title: aiContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          connectionGoal,
          customerSegment,
          challenges: currentChallenges || 'general challenges'
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

async function generateCustomerContent(connectionGoal, customerSegment, currentChallenges) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback content');
      return {
        title: `Customer Strategy: ${connectionGoal}`,
        content: `Customer connection strategy focusing on ${connectionGoal} for ${customerSegment} segment. Current challenges: ${currentChallenges || 'general customer relationship challenges'}. This analysis would provide comprehensive insights into customer engagement and retention strategies.`
      };
    }
    
    const prompt = `Generate a comprehensive customer connection strategy for ${connectionGoal} targeting ${customerSegment}.

Customer Strategy Context:
- Connection Goal: ${connectionGoal}
- Customer Segment: ${customerSegment}
- Current Challenges: ${currentChallenges || 'General customer relationship challenges'}

Requirements:
- Professional marketing and business analysis language
- Customer-centric insights and behavioral patterns
- Actionable customer intelligence and recommendations
- Demographic, psychographic, and behavioral analysis
- Customer engagement tactics and relationship building
- Retention strategies and loyalty programs
- Length: 600-800 words
- Include specific tactics, implementation steps, and measurable outcomes

Structure should include:
- Understanding the customer segment and their needs
- Specific strategies to achieve the connection goal
- Implementation tactics and timeline
- Success metrics and measurement approaches

Format: Return only the customer strategy content, well-structured with clear headings and actionable recommendations.`;

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
      title: `Customer Strategy: ${connectionGoal}`,
      content: content.trim()
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback content
    return {
      title: `Customer Strategy: ${connectionGoal}`,
      content: `Customer connection strategy focusing on ${connectionGoal} for ${customerSegment} segment. Current challenges: ${currentChallenges || 'general customer relationship challenges'}. This analysis would provide comprehensive insights into customer engagement and retention strategies.`
    };
  }
}

