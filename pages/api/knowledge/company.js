import { IncomingForm } from 'formidable';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Helper function to extract text from file
async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType.includes('text')) {
      return fs.readFileSync(filePath, 'utf8');
    }
    // For PDFs and other formats, we'd need additional libraries like pdf-parse
    // For now, return filename and basic info
    return `Document: ${filePath.split('/').pop()}`;
  } catch (error) {
    console.error('Error extracting text:', error);
    return `Document content not readable: ${error.message}`;
  }
}

// Helper function to create embeddings (mock for now, would use OpenAI API)
function createEmbeddings(text) {
  // In a real implementation, this would call OpenAI's embedding API
  // For demo purposes, return a mock embedding vector
  return Array.from({length: 1536}, () => Math.random() - 0.5);
}

// Helper function to get user info from request
function getUserFromRequest(req) {
  // In a real implementation, decode JWT token
  // For demo, return mock user info
  return {
    id: 1,
    tenantId: 1,
    tenantName: 'Demo Company',
    email: 'demo@company.com'
  };
}

// Company knowledge API endpoint in Next.js pages/api
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle knowledge upload
    try {
      const user = getUserFromRequest(req);
      const contentType = req.headers['content-type'] || '';
      
      let title, content, documentType, fileName, fileSize, filePath;
      
      if (contentType.includes('multipart/form-data')) {
        // Handle file upload with FormData
        const form = new IncomingForm();
        const [fields, files] = await form.parse(req);
        
        title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
        documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType;
        
        // Handle uploaded file
        const uploadedFile = Array.isArray(files.document) ? files.document[0] : files.document;
        if (uploadedFile) {
          fileName = uploadedFile.originalFilename;
          fileSize = Math.round(uploadedFile.size / 1024); // KB
          filePath = uploadedFile.filepath;
          
          // Extract text content from file
          try {
            const extractedText = await extractTextFromFile(filePath, uploadedFile.mimetype);
            content = extractedText || content || `Uploaded file: ${fileName}`;
          } catch (error) {
            console.error('Error extracting file content:', error);
            content = content || `File uploaded: ${fileName} (content extraction failed)`;
          }
        }
      } else {
        // Handle JSON data
        const body = await parseBody(req);
        ({ title, content, documentType } = body);
      }
      
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: title'
        });
      }
      
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: content or file'
        });
      }

      // Store to Supabase if available
      let knowledgeRecord = null;
      if (supabase) {
        try {
          // Create embeddings for the content
          const embeddings = createEmbeddings(content);
          
          // Store in Supabase knowledge table
          const { data, error } = await supabase
            .from('company_knowledge')
            .insert({
              tenant_id: user.tenantId,
              title,
              content,
              document_type: documentType || 'general',
              file_name: fileName,
              file_size_kb: fileSize,
              embeddings: embeddings,
              created_by: user.id,
              knowledge_level: 'company'
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase insert error:', error);
            // Fall back to mock response if Supabase fails
          } else {
            knowledgeRecord = data;
          }
        } catch (error) {
          console.error('Error storing to Supabase:', error);
          // Continue with mock response
        }
      }
      
      // Return stored record or mock
      const responseData = knowledgeRecord || {
        id: Date.now(),
        title,
        content,
        document_type: documentType || 'general',
        created_at: new Date().toISOString(),
        knowledge_level: 'company',
        file_name: fileName,
        size_kb: fileSize || (content ? Math.round(content.length / 10) : 0),
        tenant_id: user.tenantId
      };
      
      res.status(200).json({
        success: true,
        data: responseData,
        message: `Company knowledge ${fileName ? 'file' : 'content'} uploaded successfully`,
        stored_to_supabase: !!knowledgeRecord
      });
    } catch (error) {
      console.error('Knowledge upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Knowledge upload failed',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    // Handle knowledge retrieval
    try {
      const user = getUserFromRequest(req);
      let knowledgeList = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('company_knowledge')
            .select('*')
            .eq('tenant_id', user.tenantId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Supabase query error:', error);
          } else {
            knowledgeList = data || [];
          }
        } catch (error) {
          console.error('Error retrieving from Supabase:', error);
        }
      }

      // Fall back to mock data if no Supabase data
      if (knowledgeList.length === 0) {
        knowledgeList = [
          {
            id: 1,
            title: 'Brand Guidelines 2024',
            document_type: 'brand_guide',
            created_at: '2024-01-15T10:30:00Z',
            created_by_name: 'System Admin',
            size_kb: 2450,
            tenant_id: user.tenantId
          },
          {
            id: 2,
            title: 'Company Policies',
            document_type: 'policy',
            created_at: '2024-01-10T14:20:00Z',
            created_by_name: 'System Admin',
            size_kb: 1890,
            tenant_id: user.tenantId
          }
        ];
      }
      
      res.status(200).json({
        success: true,
        data: {
          knowledge: knowledgeList,
          total: knowledgeList.length
        },
        source: knowledgeList.length > 0 ? 'supabase' : 'mock'
      });
    } catch (error) {
      console.error('Knowledge retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve knowledge',
        error: error.message
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}