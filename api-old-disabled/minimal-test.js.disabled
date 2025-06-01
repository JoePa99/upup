// Minimal Express server for testing
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server working' });
});

app.get('/api/test-minimal', (req, res) => {
  res.json({ 
    message: 'Minimal test route working!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/test-post', (req, res) => {
  res.json({
    success: true,
    message: 'POST route working',
    body: req.body
  });
});

module.exports = app;