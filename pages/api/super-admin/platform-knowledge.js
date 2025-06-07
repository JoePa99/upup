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
  if (req.method === 'GET') {
    return getPlatformKnowledge(req, res);
  } else if (req.method === 'POST') {
    return uploadPlatformKnowledge(req, res);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPlatformKnowledge(req, res) {
  try {
    console.log('Fetching platform knowledge...');
    
    // Get all platform knowledge entries
    const { data: platformKnowledge, error } = await supabase
      .from('platform_knowledge')
      .select(`
        id,
        title,
        filename,
        file_size,
        content_type,
        category,
        document_type,
        status,
        created_at,
        updated_at,
        usage_count
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching platform knowledge:', error);
      // Return fallback data if table doesn't exist yet
      console.log('Returning empty platform knowledge due to error');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    console.log('Platform knowledge fetched:', platformKnowledge?.length || 0, 'items');

    return res.status(200).json({
      success: true,
      data: platformKnowledge || []
    });

  } catch (error) {
    console.error('Platform knowledge fetch error:', error);
    return res.status(200).json({
      success: true,
      data: [] // Return empty array instead of error for now
    });
  }
}

async function uploadPlatformKnowledge(req, res) {
  try {
    const form = formidable({ multiples: true });
    
    const [fields, files] = await form.parse(req);

    // Process uploaded files
    const uploadedFiles = [];
    const fileEntries = Object.entries(files);

    for (const [key, fileArray] of fileEntries) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      if (!file) continue;

      // Read file content
      const fileContent = fs.readFileSync(file.filepath, 'utf8');
      
      // Determine category and document type from filename
      const filename = file.originalFilename || file.newFilename;
      const category = determineCategory(filename);
      const documentType = determineDocumentType(filename);
      
      // Insert into platform knowledge base
      const { data: knowledgeEntry, error } = await supabase
        .from('platform_knowledge')
        .insert([
          {
            title: filename.replace(/\.[^/.]+$/, ""), // Remove file extension
            filename: filename,
            file_size: file.size,
            content_type: file.mimetype,
            content: fileContent,
            category: category,
            document_type: documentType,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            usage_count: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting platform knowledge:', error);
        continue;
      }

      uploadedFiles.push(knowledgeEntry);

      // Clean up temp file
      fs.unlinkSync(file.filepath);
    }

    return res.status(201).json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} platform knowledge file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Platform knowledge upload error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

function determineCategory(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('hr') || lowerFilename.includes('human')) return 'HR';
  if (lowerFilename.includes('legal') || lowerFilename.includes('law')) return 'Legal';
  if (lowerFilename.includes('sales') || lowerFilename.includes('sell')) return 'Sales';
  if (lowerFilename.includes('market')) return 'Marketing';
  if (lowerFilename.includes('finance') || lowerFilename.includes('accounting')) return 'Finance';
  if (lowerFilename.includes('operation') || lowerFilename.includes('process')) return 'Operations';
  
  return 'General';
}

function determineDocumentType(filename) {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('template')) return 'templates';
  if (lowerFilename.includes('compliance') || lowerFilename.includes('regulation')) return 'compliance';
  if (lowerFilename.includes('best') || lowerFilename.includes('practice')) return 'best_practices';
  if (lowerFilename.includes('standard') || lowerFilename.includes('guideline')) return 'industry_standards';
  
  return 'best_practices';
}