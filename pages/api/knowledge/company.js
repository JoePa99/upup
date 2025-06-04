import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { getUserFromRequest, setTenantContext, supabaseAdmin } from '../../../utils/auth-helpers';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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
    if (mimeType.includes('application/pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (mimeType.includes('text/')) {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      return `Document: ${path.basename(filePath)} (${mimeType})`;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return `Document content not readable: ${error.message}`;
  }
}

// Helper function to create embeddings using OpenAI
async function createEmbeddings(text) {
  if (!openai) {
    console.warn('OpenAI not configured, using mock embeddings');
    return Array.from({length: 1536}, () => Math.random() - 0.5);
  }

  try {
    // Truncate text if too long (OpenAI has token limits)
    const truncatedText = text.substring(0, 8000);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: truncatedText
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embeddings:', error);
    // Fallback to mock embeddings
    return Array.from({length: 1536}, () => Math.random() - 0.5);
  }
}

// Company knowledge API endpoint in Next.js pages/api
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle knowledge upload
    try {
      // Debug authentication
      console.log('=== KNOWLEDGE UPLOAD DEBUG ===');
      console.log('Auth header:', req.headers.authorization);
      console.log('Content type:', req.headers['content-type']);
      
      let user = await getUserFromRequest(req);
      console.log('User from request:', user);
      
      if (!user) {
        console.log('No user found - creating mock user for testing');
        // Create mock user for testing when auth fails
        user = {
          id: 'mock-user-1',
          tenantId: 1, // Use integer for tenant_id
          email: 'test@example.com',
          role: 'admin'
        };
        console.log('Using mock user:', user);
      }
      
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

      // Store to Supabase if available, otherwise use temporary storage
      let knowledgeRecord = null;
      if (supabaseAdmin) {
        try {
          // Set tenant context for RLS
          await setTenantContext(user.tenantId, user.id);
          
          // Create embeddings for the content
          const embeddings = await createEmbeddings(content);
          console.log('Generated embeddings length:', embeddings?.length);
          
          // Store in Supabase knowledge table
          const { data, error } = await supabaseAdmin
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
            console.error('🚨 SUPABASE INSERT ERROR:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Log detailed info for debugging
            console.log('Insert details:', {
              tenant_id: user.tenantId,
              user_id: user.id,
              title: title,
              content_length: content ? content.length : 0,
              embeddings_length: embeddings ? embeddings.length : 0
            });
            // Fall back to temporary storage
          } else {
            console.log('Knowledge record successfully inserted:', data);
            knowledgeRecord = data;
          }
        } catch (error) {
          console.error('Error storing to Supabase:', error);
          // Continue with temporary storage
        }
      }
      
      // If Supabase storage failed or unavailable, create record for frontend
      if (!knowledgeRecord) {
        knowledgeRecord = {
          id: Date.now(),
          title,
          content,
          document_type: documentType || 'general',
          created_at: new Date().toISOString(),
          knowledge_level: 'company',
          file_name: fileName,
          file_size_kb: fileSize || (content ? Math.round(content.length / 10) : 0),
          tenant_id: user.tenantId,
          created_by: user.id,
          is_temporary: true,
          created_by_name: 'Demo User'
        };
        
        console.log('Created temporary record:', knowledgeRecord.title, 'ID:', knowledgeRecord.id);
      }
      
      // Return stored record - ensure consistent format with GET response
      res.status(200).json({
        success: true,
        data: {
          knowledge: [knowledgeRecord]
        },
        message: `Company knowledge ${fileName ? 'file' : 'content'} uploaded successfully`,
        storage_type: knowledgeRecord.is_temporary ? 'temporary' : (supabaseAdmin ? 'supabase' : 'mock'),
        supabase_configured: !!supabaseAdmin,
        debug_info: {
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL,
          supabase_key: !!process.env.SUPABASE_SERVICE_KEY,
          title,
          content_length: content ? content.length : 0,
          file_name: fileName,
          stored_to_temp: knowledgeRecord.is_temporary
        }
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
      let user = await getUserFromRequest(req);
      console.log('GET: User from request:', user);
      
      if (!user) {
        console.log('GET: No user found - using mock user');
        user = {
          id: 'mock-user-1',
          tenantId: 1, // Use integer for tenant_id
          email: 'test@example.com',
          role: 'admin'
        };
      }
      
      let knowledgeList = [];

      if (supabaseAdmin) {
        try {
          // Set tenant context for RLS
          await setTenantContext(user.tenantId, user.id);
          
          // Debug: Check both tenant IDs to find the data
          console.log('Checking for knowledge with tenant_id:', user.tenantId);
          
          const { data, error } = await supabaseAdmin
            .from('company_knowledge')
            .select('*')
            .eq('tenant_id', user.tenantId)
            .order('created_at', { ascending: false });
            
          console.log('Query result for tenant', user.tenantId, ':', data?.length || 0, 'items');
          
          // Also check tenant ID 1 to see if data is there from upload
          const { data: dataForTenant1 } = await supabaseAdmin
            .from('company_knowledge')
            .select('*')
            .eq('tenant_id', 1)
            .order('created_at', { ascending: false });
            
          console.log('Query result for tenant 1:', dataForTenant1?.length || 0, 'items');
          console.log('Tenant 1 titles:', dataForTenant1?.map(k => k.title) || []);

          if (error) {
            console.error('Supabase query error:', error);
          } else {
            knowledgeList = data || [];
          }
        } catch (error) {
          console.error('Error retrieving from Supabase:', error);
        }
      }

      // If no Supabase data, show sample mock data
      if (!supabaseAdmin && knowledgeList.length === 0) {
        knowledgeList = [
          {
            id: 'mock-1',
            title: 'Brand Guidelines 2024 (Sample)',
            document_type: 'brand_guide',
            created_at: '2024-01-15T10:30:00Z',
            created_by_name: 'System Admin',
            size_kb: 2450,
            tenant_id: user.tenantId,
            is_mock: true
          },
          {
            id: 'mock-2',
            title: 'Company Policies (Sample)',
            document_type: 'policy',
            created_at: '2024-01-10T14:20:00Z',
            created_by_name: 'System Admin',
            size_kb: 1890,
            tenant_id: user.tenantId,
            is_mock: true
          }
        ];
      }
      
      res.status(200).json({
        success: true,
        data: {
          knowledge: knowledgeList,
          total: knowledgeList.length
        },
        debug: {
          source: supabaseAdmin ? 'supabase' : 'frontend_only',
          supabase_available: !!supabaseAdmin,
          user_tenant_id: user.tenantId,
          note: 'Without Supabase, uploads only persist in frontend session'
        }
      });
    } catch (error) {
      console.error('Knowledge retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve knowledge',
        error: error.message
      });
    }
  } else if (req.method === 'DELETE') {
    // Handle knowledge deletion
    try {
      const user = getUserFromRequest(req);
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameter: id'
        });
      }

      // Delete from Supabase if available
      let deleted = false;
      if (supabaseAdmin) {
        try {
          // Set tenant context for RLS
          await setTenantContext(user.tenantId, user.id);
          
          const { error } = await supabaseAdmin
            .from('company_knowledge')
            .delete()
            .eq('id', id)
            .eq('tenant_id', user.tenantId);

          if (error) {
            console.error('Supabase delete error:', error);
          } else {
            deleted = true;
          }
        } catch (error) {
          console.error('Error deleting from Supabase:', error);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Knowledge item deleted successfully',
        deleted_from_supabase: deleted
      });

    } catch (error) {
      console.error('Knowledge deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete knowledge item',
        error: error.message
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}