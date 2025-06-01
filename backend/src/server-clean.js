const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Clean server working' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Mock content generation endpoint
app.post('/api/content/generate', (req, res) => {
  try {
    const { contentTopic, contentType, contentAudience } = req.body;
    
    const mockContent = `Here's strategic content about "${contentTopic || 'business strategy'}" for ${contentType || 'general content'} targeting "${contentAudience || 'professionals'}". This is a mock response to test the API functionality. In a real implementation, this would use AI to generate contextual content based on your company's knowledge base and brand guidelines.`;
    
    res.json({
      success: true,
      data: {
        content: mockContent,
        title: `Strategic Content: ${contentTopic || 'Business Strategy'}`,
        metadata: {
          contentType: contentType || 'general',
          contentAudience: contentAudience || 'professionals',
          generatedAt: new Date().toISOString(),
          wordCount: mockContent.split(' ').length
        }
      }
    });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Content generation failed',
      error: error.message
    });
  }
});

// Mock knowledge upload endpoint
app.post('/api/knowledge/company', (req, res) => {
  try {
    const { title, content, documentType } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content'
      });
    }
    
    const mockKnowledge = {
      id: Date.now(),
      title,
      content,
      document_type: documentType || 'text',
      created_at: new Date().toISOString(),
      knowledge_level: 'company'
    };
    
    res.json({
      success: true,
      data: mockKnowledge,
      message: 'Company knowledge uploaded successfully'
    });
  } catch (error) {
    console.error('Knowledge upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Knowledge upload failed',
      error: error.message
    });
  }
});

// Get company knowledge
app.get('/api/knowledge/company', (req, res) => {
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
  
  res.json({
    success: true,
    data: {
      knowledge: mockKnowledge,
      total: mockKnowledge.length
    }
  });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'UPUP Clean API Server' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server'
  });
});

// Start server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Clean server running on port ${PORT}`);
  });
}

module.exports = app;