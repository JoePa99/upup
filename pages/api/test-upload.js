// Basic file upload test with minimal dependencies
export default function handler(req, res) {
  if (req.method === 'POST') {
    // For file uploads, we'd normally use formidable
    // But for this test we'll just accept JSON to verify the endpoint works
    try {
      const { title, content } = req.body || {};
      
      // Create a mock upload result
      const result = {
        id: Date.now(),
        title: title || 'Untitled',
        content_preview: content ? `${content.substring(0, 50)}...` : 'No content',
        size: content ? content.length : 0,
        created_at: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        message: 'Upload test successful (JSON only, no files)',
        result,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL === '1'
        }
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Test upload failed',
        error: error.message
      });
    }
  } else {
    res.status(200).json({
      success: true,
      message: 'Test upload endpoint ready (JSON only, no files)',
      instructions: 'Send a POST request with JSON body including title and content'
    });
  }
}