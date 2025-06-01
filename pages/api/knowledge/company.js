import { IncomingForm } from 'formidable';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

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

// Company knowledge API endpoint in Next.js pages/api
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle knowledge upload
    try {
      const contentType = req.headers['content-type'] || '';
      
      let title, content, documentType, fileName, fileSize;
      
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
          
          // In a real implementation, you'd process the file content here
          // For demo, we'll just use the filename and size
          content = content || `Uploaded file: ${fileName} (${fileSize}KB)`;
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
      
      if (!content && !fileName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: content or file'
        });
      }
      
      const mockKnowledge = {
        id: Date.now(),
        title,
        content: content || `File content from ${fileName}`,
        document_type: documentType || 'general',
        created_at: new Date().toISOString(),
        knowledge_level: 'company',
        file_name: fileName,
        size_kb: fileSize || (content ? Math.round(content.length / 10) : 0)
      };
      
      res.status(200).json({
        success: true,
        data: mockKnowledge,
        message: `Company knowledge ${fileName ? 'file' : 'content'} uploaded successfully`
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
    const mockKnowledge = [
      {
        id: 1,
        title: 'Brand Guidelines 2024',
        document_type: 'brand_guide',
        created_at: '2024-01-15T10:30:00Z',
        created_by_name: 'System Admin',
        size_kb: 2450
      },
      {
        id: 2,
        title: 'Company Policies',
        document_type: 'policy',
        created_at: '2024-01-10T14:20:00Z',
        created_by_name: 'System Admin',
        size_kb: 1890
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        knowledge: mockKnowledge,
        total: mockKnowledge.length
      },
      note: 'From Next.js API route'
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}