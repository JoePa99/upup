// Super simple knowledge upload endpoint with minimal dependencies
import { IncomingForm } from 'formidable';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('Simple knowledge upload API called', req.method);
  
  if (req.method === 'POST') {
    try {
      // Parse the multipart form data
      const form = new IncomingForm({
        keepExtensions: true,
        multiples: false,
      });
      
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error parsing form data',
            error: err.message
          });
        }
        
        // Extract form fields
        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
        
        // Get file info if available
        let fileInfo = null;
        const uploadedFile = files.document;
        
        if (uploadedFile) {
          const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
          
          if (file) {
            fileInfo = {
              fileName: file.originalFilename || file.name,
              size: file.size,
              path: file.filepath,
              type: file.mimetype,
            };
          }
        }
        
        // Create a mock knowledge record
        const mockKnowledgeRecord = {
          id: Date.now(),
          title: title || 'Untitled Document',
          content_length: content ? content.length : 0,
          document_type: 'general',
          created_at: new Date().toISOString(),
          file: fileInfo
        };
        
        // Return success with mock data
        res.status(200).json({
          success: true,
          message: 'Knowledge upload simulation successful',
          data: mockKnowledgeRecord
        });
      });
    } catch (error) {
      console.error('Simple knowledge upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Simple knowledge upload failed',
        error: error.message
      });
    }
  } else {
    res.status(200).json({
      success: true,
      message: 'Simple knowledge upload endpoint ready',
      instructions: 'Send a POST request with multipart/form-data including title, content, and document fields'
    });
  }
}