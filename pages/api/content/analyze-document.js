import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    let documentText = '';
    let documentSource = '';

    // Check if it's a file upload or text analysis
    const contentType = req.headers['content-type'];
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle file upload
      const form = formidable({ multiples: false });
      const [fields, files] = await form.parse(req);
      
      const file = files.document ? (Array.isArray(files.document) ? files.document[0] : files.document) : null;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Extract text from file based on type
      try {
        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(file.filepath);
          const pdfData = await pdfParse(dataBuffer);
          documentText = pdfData.text;
          documentSource = `PDF file: ${file.originalFilename}`;
        } else if (file.mimetype?.includes('text/') || file.originalFilename?.endsWith('.txt')) {
          documentText = fs.readFileSync(file.filepath, 'utf8');
          documentSource = `Text file: ${file.originalFilename}`;
        } else {
          return res.status(400).json({ message: 'Unsupported file type. Please upload PDF or TXT files.' });
        }
        
        // Clean up temp file
        fs.unlinkSync(file.filepath);
      } catch (error) {
        console.error('Error processing file:', error);
        return res.status(500).json({ message: 'Error processing uploaded file' });
      }
    } else {
      // Handle text-based analysis
      const { text } = req.body;
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: 'No document text provided' });
      }
      documentText = text;
      documentSource = 'Pasted text';
    }

    if (!documentText || documentText.trim().length === 0) {
      return res.status(400).json({ message: 'No readable text found in document' });
    }

    // Analyze document with OpenAI
    const analysis = await analyzeDocumentWithAI(documentText, documentSource);
    
    return res.status(200).json({
      success: true,
      data: {
        analysis,
        documentLength: documentText.length,
        source: documentSource,
        analyzedAt: new Date().toISOString(),
        documentText: documentText // Include the actual document text for chat
      }
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return res.status(500).json({
      message: 'Document analysis failed',
      error: error.message
    });
  }
}

async function analyzeDocumentWithAI(documentText, documentSource) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OpenAI API key found, using fallback analysis');
      return generateFallbackAnalysis(documentText, documentSource);
    }

    const prompt = `You are an expert legal analyst. Please analyze this legal document and provide insights based on what you actually find in the text, not a generic template.

Focus on:
- What type of document this actually is
- The specific provisions, terms, and clauses present
- Real risks or issues you can identify from the content
- Practical recommendations based on what's missing or problematic
- Any unusual or noteworthy aspects of this particular document

Be conversational but professional. Use headings and bullets for readability, but tailor your analysis completely to this specific document.

Document Source: ${documentSource}
Document Text:
${documentText.substring(0, 4000)}

Analyze what's actually here, not what should be here:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal analyst providing professional document reviews. Your analysis should be thorough, practical, and highlight both risks and opportunities. Always include appropriate disclaimers about the need for qualified legal counsel.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || 'Failed to generate analysis';
    
    // Add standard disclaimer
    const fullAnalysis = `${analysis}

⚠️ IMPORTANT DISCLAIMER: This AI analysis is for informational purposes only and does not constitute legal advice. Always consult with a qualified attorney before making legal decisions or executing agreements.`;
    
    return fullAnalysis;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackAnalysis(documentText, documentSource);
  }
}

function generateFallbackAnalysis(documentText, documentSource) {
  const wordCount = documentText.split(/\s+/).length;
  
  // Try to identify document type from content
  let documentType = 'Legal Document';
  if (/non.?disclosure|nda|confidential/i.test(documentText)) {
    documentType = 'Non-Disclosure Agreement';
  } else if (/employment|employee|job|position/i.test(documentText)) {
    documentType = 'Employment Document';
  } else if (/service|work|perform|deliver/i.test(documentText)) {
    documentType = 'Service Agreement';
  } else if (/purchase|buy|sell|sale/i.test(documentText)) {
    documentType = 'Purchase/Sale Agreement';
  } else if (/lease|rent|rental|tenant/i.test(documentText)) {
    documentType = 'Lease Agreement';
  }

  // Extract some actual content snippets
  const sentences = documentText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const firstFewSentences = sentences.slice(0, 3).map(s => s.trim()).join('. ');

  // Look for specific terms and parties
  const parties = [];
  const partyMatches = documentText.match(/\b[A-Z][a-zA-Z\s&,.]*(LLC|Inc|Corp|Corporation|Company|Ltd)\b/g);
  if (partyMatches) {
    parties.push(...partyMatches.slice(0, 2));
  }

  return `## Document Analysis: ${documentType}

**Source:** ${documentSource} (${wordCount} words)  
**Analyzed:** ${new Date().toLocaleDateString()}

### What I Found

This appears to be a ${documentType.toLowerCase()}${parties.length > 0 ? ` involving ${parties.join(' and ')}` : ''}.

${firstFewSentences ? `**Key Content:** ${firstFewSentences}...` : ''}

### Quick Assessment

Based on a scan of the document content, here are some observations:

${/signature|signed|executed/i.test(documentText) ? '• **Execution provisions** appear to be included\n' : '• **Missing execution/signature provisions** - verify how this document gets signed\n'}
${/termination|terminate|end|expir/i.test(documentText) ? '• **Termination clauses** are present\n' : '• **Termination procedures** may need clarification\n'}
${/liability|liable|damages|indemnif/i.test(documentText) ? '• **Liability terms** are addressed\n' : '• **Liability protection** should be reviewed and potentially strengthened\n'}
${/governing law|jurisdiction|court/i.test(documentText) ? '• **Governing law** is specified\n' : '• **Jurisdiction and governing law** need to be clearly stated\n'}

### Recommendations

Since I can only provide basic analysis without AI assistance:

1. **Get professional review** - Have a qualified attorney examine this document
2. **Verify completeness** - Ensure all necessary terms for this type of agreement are included  
3. **Check compliance** - Confirm the document meets applicable legal requirements
4. **Review with counterparty** - Discuss any unclear terms before signing

---
⚠️ **Note:** This is a basic analysis only. Always consult with qualified legal counsel before executing any agreement.`;
}