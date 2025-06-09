import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

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
          const dataBuffer = fs.readFileSync(file.filepath);
          const pdfData = await pdfParse(dataBuffer);
          fileContent = pdfData.text;
          console.log('PDF text extracted, length:', fileContent.length);
          console.log('PDF text preview:', fileContent.substring(0, 200));
        } else if (file.mimetype?.includes('text/') || file.originalFilename?.endsWith('.txt') || file.originalFilename?.endsWith('.md')) {
          fileContent = fs.readFileSync(file.filepath, 'utf8');
        } else {
          // For other file types, store filename and basic info
          fileContent = `Document: ${file.originalFilename} (${file.mimetype || 'unknown type'})`;
        }
      } catch (error) {
        console.error('Error extracting file content:', error);
        fileContent = `Document: ${file.originalFilename} (content extraction failed: ${error.message})`;
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