const express = require('express');
const router = express.Router();

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

module.exports = router;