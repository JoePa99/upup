export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { question, documentText, conversationHistory } = req.body;

    if (!question || !documentText) {
      return res.status(400).json({ 
        message: 'Question and document text are required' 
      });
    }

    // Generate response with OpenAI
    const response = await chatWithDocument(question, documentText, conversationHistory || []);
    
    return res.status(200).json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Document chat error:', error);
    return res.status(500).json({
      message: 'Failed to process question',
      error: error.message
    });
  }
}

async function chatWithDocument(question, documentText, conversationHistory) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback response');
      return generateFallbackResponse(question);
    }

    // Prepare conversation context
    const messages = [
      {
        role: 'system',
        content: `You are a legal expert assistant helping users understand a legal document. 

DOCUMENT CONTENT:
${documentText.substring(0, 3000)}

Guidelines:
- Answer questions specifically about this document
- Provide clear, practical explanations
- Highlight important legal concepts and risks
- If the document doesn't contain information to answer the question, say so clearly
- Always include appropriate disclaimers about seeking qualified legal counsel
- Be concise but thorough in your responses`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(item => {
      messages.push({ role: 'user', content: item.question });
      messages.push({ role: 'assistant', content: item.response });
    });

    // Add current question
    messages.push({ role: 'user', content: question });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Unable to generate response';
    
    // Add disclaimer to response
    return `${aiResponse}

💡 Remember: This is AI assistance for informational purposes only. For legal decisions, always consult with a qualified attorney.`;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackResponse(question);
  }
}

function generateFallbackResponse(question) {
  const responses = {
    'liability': 'This document should include liability provisions to protect parties from potential damages. Look for clauses that limit or cap liability exposure.',
    'termination': 'Check for termination clauses that specify how and when the agreement can be ended, including notice requirements and post-termination obligations.',
    'governing law': 'The document should specify which state or jurisdiction\'s laws govern the agreement and where disputes would be resolved.',
    'payment': 'Review payment terms including amounts, due dates, late fees, and accepted payment methods.',
    'intellectual property': 'Look for clauses addressing ownership of intellectual property, licensing rights, and confidentiality requirements.',
    'default': 'I can help you understand various aspects of this legal document. Try asking about specific topics like liability, termination, payment terms, or governing law.'
  };

  // Simple keyword matching for fallback
  const lowerQuestion = question.toLowerCase();
  for (const [key, response] of Object.entries(responses)) {
    if (lowerQuestion.includes(key)) {
      return `${response}

⚠️ This is a general response. For specific legal advice about your document, please consult with a qualified attorney.`;
    }
  }

  return responses.default + '\n\n⚠️ This is a general response. For specific legal advice about your document, please consult with a qualified attorney.';
}