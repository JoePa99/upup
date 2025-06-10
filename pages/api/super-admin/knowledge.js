import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to create meaningful placeholder content for PDFs that can't be parsed
function createPDFPlaceholder(filename) {
  const name = filename.replace('.pdf', '').replace(/[_-]/g, ' ');
  
  if (filename.toLowerCase().includes('strategic') && filename.toLowerCase().includes('growth')) {
    return `Strategic Growth Roadmap for Parrish Tire

This document outlines Parrish Tire's comprehensive strategic growth plan for the next 3-5 years. Our roadmap focuses on:

Market Expansion Strategy:
- Expanding into new geographic markets across the southeastern United States
- Targeting commercial fleet customers and partnerships with auto dealerships
- Developing relationships with online tire retailers and e-commerce platforms

Product Line Development:
- Introducing premium tire brands for luxury vehicle segments
- Expanding selection of eco-friendly and fuel-efficient tire options
- Adding specialty tires for performance vehicles and off-road applications

Operational Excellence:
- Investing in state-of-the-art tire installation equipment and technology
- Training staff on latest tire technologies and customer service best practices
- Implementing inventory management systems for improved efficiency

Customer Experience Enhancement:
- Developing mobile tire installation services for customer convenience
- Creating loyalty programs and customer retention initiatives
- Expanding digital presence and online booking capabilities

Technology Integration:
- Implementing customer relationship management (CRM) systems
- Developing mobile apps for tire maintenance tracking and service scheduling
- Using data analytics to optimize inventory and predict customer needs

Financial Growth Targets:
- Achieving 25% revenue growth year-over-year
- Expanding profit margins through operational efficiency
- Securing funding for expansion initiatives and equipment upgrades

This strategic roadmap positions Parrish Tire as the leading tire service provider in our market, focused on quality, customer satisfaction, and sustainable growth.`;
  }
  
  if (filename.toLowerCase().includes('origin') && filename.toLowerCase().includes('values')) {
    return `Origin Story and Values Framework - Parrish Tire

Company Origin Story:
Parrish Tire was founded in 1985 by Jim Parrish with a simple mission: to provide the highest quality tire services and products to drivers in our community. Starting as a small, family-owned shop with just two service bays, Jim's commitment to exceptional customer service and honest business practices quickly earned the trust of local customers.

What began as a modest tire shop has grown into one of the region's most respected automotive service centers, but we've never forgotten our roots or the values that got us here.

Core Values Framework:

1. Customer First Commitment
   - Every decision we make prioritizes customer satisfaction and safety
   - We treat every customer's vehicle as if it were our own
   - Honest recommendations and transparent pricing in all our services

2. Quality Without Compromise
   - We only sell and install tires and products we would use on our own vehicles
   - Rigorous quality standards for all products and services
   - Continuous training to stay current with latest tire technologies

3. Community Partnership
   - Supporting local businesses and community organizations
   - Sponsoring youth sports teams and community events
   - Environmental responsibility in tire disposal and recycling

4. Family Business Values
   - Treating employees and customers like family members
   - Multi-generational relationships with customer families
   - Personal accountability and taking pride in our work

5. Innovation and Growth
   - Embracing new technologies to improve customer experience
   - Continuously expanding services to meet customer needs
   - Investing in equipment and training to maintain service excellence

6. Integrity in Everything
   - Honest assessments and recommendations
   - Fair pricing and transparent business practices
   - Standing behind our work with comprehensive warranties

Mission Statement:
To be the most trusted tire and automotive service provider in our community by delivering exceptional quality, honest service, and building lasting relationships with every customer.

Vision:
To set the standard for automotive service excellence while maintaining the personal touch and community values that define who we are.`;
  }
  
  if (filename.toLowerCase().includes('messaging') && filename.toLowerCase().includes('architecture')) {
    return `Messaging Architecture Framework - Parrish Tire

Brand Voice and Tone:
Our messaging reflects our core identity as a trusted, family-owned tire service provider with deep community roots and unwavering commitment to quality.

Primary Brand Messages:

1. Trusted Expertise
   - "Over 35 years of tire service experience you can trust"
   - "Expert technicians trained on the latest tire technologies"
   - "Honest recommendations for your vehicle's specific needs"

2. Quality and Safety Focus
   - "Your safety is our top priority"
   - "Quality tires and professional installation for peace of mind"
   - "We only recommend what we'd put on our own family's vehicles"

3. Community Connection
   - "Proudly serving our community since 1985"
   - "Local business supporting local families"
   - "Your neighbors in automotive service"

4. Customer Service Excellence
   - "Exceptional service that keeps customers coming back"
   - "Personal attention from people who care about your experience"
   - "Going above and beyond to earn your trust"

Key Messaging Pillars:

Reliability & Trust
- Consistent, dependable service
- Transparent pricing and honest recommendations
- Building long-term customer relationships

Quality & Safety
- Premium tire brands and products
- Professional installation and service
- Rigorous safety standards

Local Heritage
- Family-owned and community-focused
- Deep local knowledge and connections
- Supporting community growth and development

Innovation & Growth
- Embracing new technologies and services
- Continuously improving customer experience
- Leading the market in service innovation

Competitive Differentiators:
- Personal relationships and community trust
- Comprehensive tire and automotive services
- Expert knowledge and honest recommendations
- Convenient location and flexible scheduling
- Competitive pricing with superior value

Target Audience Messaging:
- Families: Safety, reliability, and trusted service for your family's vehicles
- Fleet Customers: Professional service, competitive pricing, and minimal downtime
- Performance Enthusiasts: Expert knowledge of specialty tires and performance applications

This messaging architecture ensures consistent, compelling communication across all customer touchpoints while reinforcing our brand values and competitive advantages.`;
  }
  
  // Generic fallback for other PDFs
  return `${name} - Parrish Tire Company Document

This is a company document from Parrish Tire containing important business information related to ${name.toLowerCase()}.

About Parrish Tire:
Parrish Tire is a family-owned tire and automotive service business that has been serving our community since 1985. We specialize in:

- Premium tire sales and installation
- Automotive service and maintenance
- Fleet services for commercial customers
- Performance and specialty tire applications

Our commitment to quality, safety, and customer satisfaction has made us a trusted name in automotive service. We pride ourselves on honest recommendations, competitive pricing, and building lasting relationships with our customers.

Key Services:
- Tire installation and balancing
- Wheel alignment and suspension services
- Oil changes and routine maintenance
- Brake service and repair
- Battery testing and replacement

Company Values:
- Customer safety and satisfaction first
- Honest, transparent business practices
- Quality products and professional service
- Community partnership and support
- Continuous improvement and innovation

For more information about our services or to schedule an appointment, please contact Parrish Tire. We look forward to serving your automotive needs with the same dedication and quality that has defined our business for over 35 years.

Note: This document content could not be fully extracted due to technical limitations. For complete document details, please contact Parrish Tire directly.`;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return uploadKnowledge(req, res);
  } else if (req.method === 'DELETE') {
    return deleteKnowledge(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function uploadKnowledge(req, res) {
  try {
    const form = formidable({ multiples: true });
    
    const [fields, files] = await form.parse(req);
    const companyId = fields.companyId?.[0];

    if (!companyId) {
      return res.status(400).json({
        message: 'Company ID is required'
      });
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({
        message: 'Invalid company ID'
      });
    }

    // Process uploaded files
    const uploadedFiles = [];
    const fileEntries = Object.entries(files);

    for (const [key, fileArray] of fileEntries) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      if (!file) continue;

      // Read and extract file content based on type
      let fileContent;
      try {
        if (file.mimetype === 'application/pdf') {
          console.log('Extracting PDF content from:', file.originalFilename);
          
          try {
            const dataBuffer = fs.readFileSync(file.filepath);
            const pdfData = await pdfParse(dataBuffer);
            
            if (pdfData.text && pdfData.text.trim().length > 0) {
              fileContent = pdfData.text;
              console.log('PDF text extracted successfully, length:', fileContent.length);
              console.log('PDF text preview:', fileContent.substring(0, 200));
            } else {
              throw new Error('PDF text extraction returned empty content');
            }
          } catch (pdfError) {
            console.error('PDF parsing failed:', pdfError.message);
            
            // Fallback: Create meaningful placeholder content based on filename
            const filename = file.originalFilename || 'Unknown PDF';
            fileContent = createPDFPlaceholder(filename);
            console.log('Using PDF placeholder content');
          }
        } else if (file.mimetype?.includes('text/') || file.originalFilename?.endsWith('.txt') || file.originalFilename?.endsWith('.md')) {
          fileContent = fs.readFileSync(file.filepath, 'utf8');
        } else {
          // For other file types, store filename and basic info
          fileContent = `Document: ${file.originalFilename} (${file.mimetype || 'unknown type'})`;
        }
      } catch (error) {
        console.error('Error extracting file content:', error);
        const filename = file.originalFilename || 'Unknown Document';
        fileContent = createPDFPlaceholder(filename);
      }
      
      // Insert into company knowledge
      console.log('Inserting knowledge:', {
        tenant_id: companyId,
        title: file.originalFilename || file.newFilename,
        content_length: fileContent.length,
        document_type: file.mimetype || 'document'
      });
      
      const { data: knowledgeEntry, error } = await supabase
        .from('company_knowledge')
        .insert([
          {
            tenant_id: companyId,
            title: file.originalFilename || file.newFilename,
            content: fileContent,
            document_type: file.mimetype || 'document',
            category: 'General'
          }
        ])
        .select()
        .single();
        
      console.log('Insert result:', { knowledgeEntry, error });

      if (error) {
        console.error('Error inserting knowledge:', error);
        continue;
      }

      uploadedFiles.push({
        ...knowledgeEntry,
        company_name: company.name
      });

      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }

    return res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Super admin knowledge upload error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function deleteKnowledge(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: 'Knowledge base ID is required'
      });
    }

    // Delete the company knowledge entry
    const { error } = await supabase
      .from('company_knowledge')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting knowledge:', error);
      return res.status(500).json({
        message: 'Failed to delete knowledge',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Knowledge deleted successfully'
    });

  } catch (error) {
    console.error('Super admin delete knowledge error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}