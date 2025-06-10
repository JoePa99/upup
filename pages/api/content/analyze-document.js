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
        analyzedAt: new Date().toISOString()
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

    const prompt = `You are an expert legal analyst. Please provide a comprehensive analysis of the following legal document. Focus on:

1. Document Type & Overview
2. Key Legal Provisions
3. Risk Assessment (identify potential issues, gaps, or problematic clauses)
4. Compliance Considerations
5. Improvement Recommendations
6. Critical Action Items

Please structure your analysis professionally and highlight any urgent concerns or recommendations.

Document Source: ${documentSource}
Document Text (first 4000 characters):
${documentText.substring(0, 4000)}

Provide a detailed, professional legal analysis:`;

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
  const hasSignature = /signature|signed|executed/i.test(documentText);
  const hasTermination = /termination|terminate|end|expir/i.test(documentText);
  const hasLiability = /liability|liable|damages|indemnif/i.test(documentText);
  const hasGoverningLaw = /governing law|jurisdiction|court/i.test(documentText);

  return `AI LEGAL DOCUMENT ANALYSIS

DOCUMENT OVERVIEW
Source: ${documentSource}
Word Count: ${wordCount} words
Analysis Date: ${new Date().toLocaleDateString()}
Review Status: ✅ Complete (Fallback Analysis)

STRUCTURAL ANALYSIS
${hasSignature ? '✅' : '⚠️'} Signature provisions ${hasSignature ? 'present' : 'not clearly identified'}
${hasTermination ? '✅' : '⚠️'} Termination clauses ${hasTermination ? 'present' : 'not clearly identified'}  
${hasLiability ? '✅' : '⚠️'} Liability provisions ${hasLiability ? 'present' : 'not clearly identified'}
${hasGoverningLaw ? '✅' : '⚠️'} Governing law clauses ${hasGoverningLaw ? 'present' : 'not clearly identified'}

KEY RECOMMENDATIONS

🔍 IMMEDIATE REVIEW NEEDED
• Have qualified legal counsel review all provisions
• Ensure all parties understand their obligations
• Verify compliance with applicable laws and regulations
• Consider adding missing standard legal protections

⚠️ RISK MITIGATION
• Add comprehensive liability limitations if missing
• Include force majeure provisions for unforeseen circumstances  
• Specify dispute resolution procedures
• Ensure proper governing law and jurisdiction clauses

💡 BEST PRACTICES
• Consider adding automatic renewal terms with opt-out periods
• Include technology and data security requirements if applicable
• Add insurance and indemnification requirements
• Plan for periodic contract reviews and updates

📋 NEXT STEPS
1. Professional legal review by qualified attorney
2. Negotiate any identified gaps or concerns with counterparty
3. Ensure all parties have clear understanding of obligations
4. Consider industry-specific compliance requirements

⚠️ IMPORTANT DISCLAIMER: This analysis is provided for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney before executing any legal agreement.`;
}