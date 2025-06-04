import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      .select('id, company_name')
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

      // Read file content
      const fileContent = fs.readFileSync(file.filepath, 'utf8');
      
      // Insert into knowledge base
      const { data: knowledgeEntry, error } = await supabase
        .from('knowledge_base')
        .insert([
          {
            tenant_id: companyId,
            filename: file.originalFilename || file.newFilename,
            file_size: file.size,
            content_type: file.mimetype,
            content: fileContent,
            uploaded_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting knowledge:', error);
        continue;
      }

      uploadedFiles.push({
        ...knowledgeEntry,
        company_name: company.company_name
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

    // Delete the knowledge base entry
    const { error } = await supabase
      .from('knowledge_base')
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