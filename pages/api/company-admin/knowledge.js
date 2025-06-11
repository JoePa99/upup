import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to verify company admin auth
async function requireCompanyAdminAuth(req, res) {
  try {
    // Use the established auth helper that works with our authentication system
    const { getUserFromRequest } = await import('../../../utils/auth-helpers.js');
    
    const user = await getUserFromRequest(req);
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return false;
    }
    
    // Check if user is company admin or admin
    const isCompanyAdmin = user.role === 'company_admin' || user.role === 'admin';
    if (!isCompanyAdmin) {
      res.status(403).json({ success: false, message: 'Company admin access required' });
      return false;
    }

    req.user = user;
    return true;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
    return false;
  }
}

async function handler(req, res) {
  // Only allow company admins and above
  const authResult = await requireCompanyAdminAuth(req, res);
  if (!authResult) return;

  const { user } = req;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    switch (req.method) {
      case 'GET':
        // Get all knowledge for the company admin's tenant
        const { data: knowledge, error: knowledgeError } = await supabase
          .from('company_knowledge')
          .select('id, title, content, document_type, category, created_at, tenant_id')
          .eq('tenant_id', user.tenant_id)
          .order('created_at', { ascending: false });

        if (knowledgeError) {
          console.error('Error fetching company knowledge:', knowledgeError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch knowledge',
            error: knowledgeError.message 
          });
        }

        return res.status(200).json({
          success: true,
          data: knowledge || []
        });

      case 'POST':
        // Upload new knowledge files for the company
        const form = formidable({
          maxFileSize: 10 * 1024 * 1024, // 10MB limit
          multiples: true,
        });

        const [fields, files] = await form.parse(req);
        const category = fields.category?.[0] || 'general';
        const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean);

        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files provided'
          });
        }

        const results = [];
        const errors = [];

        for (const file of uploadedFiles) {
          try {
            // Read file content
            const fileContent = fs.readFileSync(file.filepath, 'utf8');
            const fileExtension = path.extname(file.originalFilename || '').toLowerCase();
            
            // Determine file type
            let fileType = 'document';
            if (['.pdf'].includes(fileExtension)) fileType = 'pdf';
            else if (['.txt', '.md'].includes(fileExtension)) fileType = 'text';
            else if (['.doc', '.docx'].includes(fileExtension)) fileType = 'document';

            // Insert knowledge record
            const { data: knowledgeRecord, error: insertError } = await supabase
              .from('company_knowledge')
              .insert({
                title: file.originalFilename || 'Untitled Document',
                content: fileContent,
                document_type: fileType,
                category,
                tenant_id: user.tenant_id
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error inserting knowledge:', insertError);
              errors.push(`Failed to upload ${file.originalFilename}: ${insertError.message}`);
            } else {
              results.push(knowledgeRecord);
            }

            // Clean up temp file
            fs.unlinkSync(file.filepath);
          } catch (fileError) {
            console.error('Error processing file:', fileError);
            errors.push(`Failed to process ${file.originalFilename}: ${fileError.message}`);
            // Clean up temp file on error
            try {
              fs.unlinkSync(file.filepath);
            } catch (cleanupError) {
              console.error('Error cleaning up temp file:', cleanupError);
            }
          }
        }

        if (results.length === 0 && errors.length > 0) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload any files',
            errors
          });
        }

        return res.status(201).json({
          success: true,
          data: results,
          message: `Successfully uploaded ${results.length} file(s)`,
          errors: errors.length > 0 ? errors : undefined
        });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company admin knowledge API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

export default handler;