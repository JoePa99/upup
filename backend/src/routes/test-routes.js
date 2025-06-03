const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const path = require('path');

// Simple test routes with no dependencies
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'Test routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

router.post('/echo', (req, res) => {
  res.json({
    message: 'Echo endpoint working',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Environment diagnostics
router.get('/diagnostics', (req, res) => {
  // Get basic system info
  const systemInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    memory: process.memoryUsage(),
    tmpdir: os.tmpdir()
  };
  
  // Check if we can write to tmp directory
  let tmpWritable = false;
  const testFile = path.join(os.tmpdir(), 'test-write-' + Date.now());
  try {
    fs.writeFileSync(testFile, 'test');
    tmpWritable = fs.existsSync(testFile);
    try {
      fs.unlinkSync(testFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (e) {
    // Can't write to tmp
  }
  
  // Check for various environment variables (don't expose actual values)
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    S3_BUCKET: !!process.env.S3_BUCKET,
    AWS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY,
    TMP_DIR_WRITABLE: tmpWritable
  };
  
  res.json({
    success: true,
    message: 'Diagnostic information',
    system: systemInfo,
    environment: envStatus,
    timestamp: new Date().toISOString()
  });
});

// Simple upload test endpoint - requires formidable
router.post('/file-upload', (req, res) => {
  try {
    // We'll attempt to use formidable, but with a fallback if not available
    let formidable;
    try {
      formidable = require('formidable');
    } catch (e) {
      return res.json({
        success: false,
        message: 'Formidable not available',
        error: e.message
      });
    }
    
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      multiples: false
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error parsing form data',
          error: err.message
        });
      }
      
      // Get file info if available
      let fileInfo = null;
      const uploadedFile = files.document;
      
      if (uploadedFile) {
        const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
        
        if (file) {
          fileInfo = {
            name: file.originalFilename || file.name,
            size: file.size,
            path: file.filepath,
            type: file.mimetype,
          };
        }
      }
      
      res.json({
        success: true,
        message: 'Test file upload successful',
        fields,
        file: fileInfo,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Test file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Test file upload failed',
      error: error.message
    });
  }
});

// Test route that handles errors
router.get('/error-test', (req, res, next) => {
  try {
    // Intentionally throw an error based on query params
    const { type } = req.query;
    
    if (type === 'sync') {
      throw new Error('Synchronous test error');
    } else if (type === 'async') {
      setTimeout(() => {
        try {
          throw new Error('Asynchronous test error');
        } catch (err) {
          next(err);
        }
      }, 100);
      return;
    } else if (type === 'db') {
      // Simulate database error
      const error = new Error('Database connection failed');
      error.code = 'ECONNREFUSED';
      throw error;
    } else if (type === 'timeout') {
      // Just hang for testing timeouts
      setTimeout(() => {
        res.json({ message: 'Delayed response' });
      }, 30000);
      return;
    } else {
      // No error, just return success
      res.json({ 
        message: 'No error triggered',
        type: type || 'none'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;