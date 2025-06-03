const express = require('express');
const router = express.Router();

// Super simple test endpoint that has no dependencies
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend test API is working',
    timestamp: new Date().toISOString()
  });
});

// Minimal knowledge endpoint - always succeeds
router.post('/knowledge', (req, res) => {
  try {
    console.log('Minimal knowledge endpoint called');
    console.log('Request body:', req.body);
    
    res.json({
      success: true,
      data: {
        id: `test-${Date.now()}`,
        title: req.body.title || 'Default Title',
        content: req.body.content || 'Default Content',
        created_at: new Date().toISOString()
      },
      message: 'Minimal knowledge endpoint succeeded'
    });
  } catch (error) {
    console.error('Error in minimal knowledge endpoint:', error);
    // Still return 200 with error info
    res.json({
      success: false,
      error: error.message,
      message: 'Error caught but returning response'
    });
  }
});

module.exports = router;