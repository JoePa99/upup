const { generateAIContent } = require('../services/ai-service');
const { logUsage } = require('../services/usage-service');

const templateController = {
  // Generate HR templates
  async generateHRTemplate(req, res) {
    try {
      const { templateType, field1, field2, field3 } = req.body;
      const tenantId = req.user.tenantId;

      if (!templateType || !field1) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: templateType, field1'
        });
      }

      let prompt = '';
      let title = '';

      switch (templateType) {
        case 'job-description':
          title = `Job Description: ${field1}`;
          prompt = `Create a professional job description for the position of "${field1}" in the ${field2} department.

Key responsibilities include: ${field3}

The job description should include:
- Company overview section for a premium art supply company
- Role summary and key responsibilities
- Required qualifications and experience
- Preferred skills and competencies
- Company culture and values alignment
- Benefits and compensation framework
- Professional growth opportunities

Write in a professional HR tone that attracts top talent while clearly communicating expectations.`;
          break;

        case 'performance-review':
          title = `Performance Review: ${field1}`;
          prompt = `Create a comprehensive performance review template for a ${field1} position during a ${field2} review period.

Focus areas: ${field3}

Include sections for:
- Overall performance summary
- Goal achievement assessment
- Core competency evaluation
- Strengths and achievements
- Development opportunities
- Goals for next period
- Career development discussion

Use a balanced, constructive approach that supports employee growth.`;
          break;

        case 'interview-questions':
          title = `Interview Questions: ${field1}`;
          prompt = `Develop a comprehensive set of interview questions for a ${field1} position conducting ${field2} interviews.

Key skills to assess: ${field3}

Include:
- 5-7 behavioral questions
- 3-5 technical/role-specific questions
- 2-3 cultural fit questions
- Follow-up probing questions
- Evaluation criteria for each question

Questions should be inclusive, legally compliant, and designed to identify the best candidates.`;
          break;

        default:
          prompt = `Create an HR template for ${templateType} with the following details:
Position/Role: ${field1}
Department/Type: ${field2}
Additional Details: ${field3}

Make it professional, comprehensive, and suitable for a premium brand company.`;
          title = `${templateType.charAt(0).toUpperCase() + templateType.slice(1)}: ${field1}`;
      }

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 700,
        temperature: 0.6
      });

      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'template_generation', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: title,
          templateType: templateType,
          metadata: {
            field1,
            field2,
            field3,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error generating HR template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate HR template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Generate Legal templates
  async generateLegalTemplate(req, res) {
    try {
      const { templateType, field1, field2, field3 } = req.body;
      const tenantId = req.user.tenantId;

      if (!templateType || !field1) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: templateType, field1'
        });
      }

      let prompt = '';
      let title = '';

      switch (templateType) {
        case 'nda':
          title = `Non-Disclosure Agreement: ${field1}`;
          prompt = `Create a professional Non-Disclosure Agreement between a premium art supply company and "${field1}".

Agreement type: ${field2}
Specific terms: ${field3}

Include:
- Proper legal header and parties identification
- Definition of confidential information
- Obligations of receiving party
- Term and duration
- Remedies for breach
- General provisions
- Signature blocks

IMPORTANT: Include a disclaimer that this is for informational purposes only and legal counsel should be consulted.

Use professional legal language while keeping it readable.`;
          break;

        case 'service-agreement':
          title = `Service Agreement: ${field1}`;
          prompt = `Create a comprehensive Service Agreement between a premium art supply company and "${field1}".

Service type: ${field2}
Scope details: ${field3}

Include:
- Services description
- Term and payment terms
- Intellectual property provisions
- Confidentiality clauses
- Limitation of liability
- Termination provisions
- General legal provisions

Add appropriate legal disclaimers and professional formatting.`;
          break;

        case 'employment-contract':
          title = `Employment Contract: ${field1}`;
          prompt = `Create an employment contract for "${field1}" with employment type: ${field2}.

Special terms: ${field3}

Include:
- Position description and reporting structure
- Compensation and benefits
- Employment terms and conditions
- Confidentiality and non-compete provisions
- Termination procedures
- General employment provisions

Ensure compliance with standard employment law practices.`;
          break;

        default:
          prompt = `Create a legal template for ${templateType} involving ${field1}.
Type/Category: ${field2}
Specific requirements: ${field3}

Include all necessary legal provisions, disclaimers, and professional formatting.`;
          title = `${templateType.charAt(0).toUpperCase() + templateType.slice(1)}: ${field1}`;
      }

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 800,
        temperature: 0.5
      });

      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'template_generation', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: title,
          templateType: templateType,
          metadata: {
            field1,
            field2,
            field3,
            generatedAt: new Date().toISOString(),
            legalDisclaimer: 'This template is for informational purposes only and does not constitute legal advice. Consult with a qualified attorney before use.'
          }
        }
      });

    } catch (error) {
      console.error('Error generating legal template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate legal template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Generate Sales templates
  async generateSalesTemplate(req, res) {
    try {
      const { templateType, field1, field2, field3 } = req.body;
      const tenantId = req.user.tenantId;

      if (!templateType || !field1) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: templateType, field1'
        });
      }

      let prompt = '';
      let title = '';

      switch (templateType) {
        case 'sales-proposal':
          title = `Sales Proposal: ${field1}`;
          prompt = `Create a compelling sales proposal for "${field1}" with proposal type: ${field2}.

Key pain points: ${field3}

Structure the proposal with:
- Executive summary
- Understanding of client challenges
- Proposed solution
- Why choose our premium brand
- Investment and timeline
- Expected outcomes
- Next steps

Use persuasive but professional language that emphasizes value and quality. Focus on ROI and business benefits.`;
          break;

        case 'email-sequence':
          title = `Email Sequence: ${field2} for ${field1}`;
          prompt = `Create an email sequence for "${field1}" with purpose: ${field2}.

Key message: ${field3}

Create 4-5 emails including:
- Welcome/Introduction email
- Educational value email
- Social proof/Success story email
- Direct value proposition email
- Urgency/Call-to-action email

Each email should build on the previous one and guide toward conversion. Use engaging subject lines and personalized content.`;
          break;

        case 'call-script':
          title = `Call Script: ${field1}`;
          prompt = `Create a sales call script for "${field1}" call type: ${field2}.

Known information: ${field3}

Include:
- Opening and rapport building
- Discovery questions
- Presentation of value proposition
- Objection handling responses
- Closing techniques
- Next steps

Make it conversational but structured, with specific questions and response frameworks.`;
          break;

        default:
          prompt = `Create a sales template for ${templateType} targeting ${field1}.
Campaign type: ${field2}
Key objectives: ${field3}

Focus on value proposition, customer benefits, and clear calls to action.`;
          title = `${templateType.charAt(0).toUpperCase() + templateType.slice(1)}: ${field1}`;
      }

      const generatedText = await generateAIContent(prompt, {
        maxTokens: 750,
        temperature: 0.7
      });

      await logUsage(tenantId, 'ai_api_calls', 1);
      await logUsage(tenantId, 'template_generation', 1);

      res.json({
        success: true,
        data: {
          content: generatedText,
          title: title,
          templateType: templateType,
          metadata: {
            field1,
            field2,
            field3,
            generatedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error generating sales template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate sales template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = templateController;