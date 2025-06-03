import { IncomingForm } from 'formidable';
import fs from 'fs';

// Disable default body parser to handle FormData
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Minimal upload endpoint called');
      
      // Parse the multipart form data
      const form = new IncomingForm({
        keepExtensions: true,
        multiples: false,
      });
      
      // Parse the form
      form.parse(req, async (err, fields, files) => {
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
              fileName: file.originalFilename,
              size: file.size,
              path: file.filepath,
              type: file.mimetype,
            };
            
            // Just read the first 100 chars of the file to verify access
            try {
              const filePreview = fs.readFileSync(file.filepath, 'utf8').substring(0, 100);
              fileInfo.preview = filePreview + '...';
            } catch (fileError) {
              fileInfo.error = fileError.message;
            }
          }
        }
        
        // Return success with debug information
        res.status(200).json({
          success: true,
          message: 'Minimal knowledge upload test successful',
          data: {
            title,
            contentLength: content ? content.length : 0,
            file: fileInfo,
            timestamp: new Date().toISOString()
          }
        });
      });
    } catch (error) {
      console.error('Minimal upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Minimal upload failed',
        error: error.message
      });
    }
  } else {
    res.status(200).json({
      success: true,
      message: 'Knowledge minimal upload endpoint ready',
      instructions: 'Send a POST request with multipart/form-data including title, content, and document fields'
    });
  }
}