const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content-controller');
const templateController = require('../controllers/template-controller');
const { authenticate } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant-context');

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(tenantContext);

// Content Generation Routes
router.post('/generate', contentController.generateContent);
router.post('/generate/growth', contentController.generateGrowthOpportunities);
router.post('/generate/market', contentController.generateMarketInsights);
router.post('/generate/customer', contentController.generateCustomerConnection);

// Template Generation Routes
router.post('/templates/hr', templateController.generateHRTemplate);
router.post('/templates/legal', templateController.generateLegalTemplate);
router.post('/templates/sales', templateController.generateSalesTemplate);

// AI Suggestions Route
router.get('/suggestions/:fieldType', async (req, res) => {
  try {
    const { fieldType } = req.params;
    const { generateSuggestions } = require('../services/ai-service');
    
    const suggestions = await generateSuggestions(fieldType);
    
    res.json({
      success: true,
      data: {
        suggestions,
        fieldType
      }
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions'
    });
  }
});

// Pin Management Routes (stored in localStorage for now, but can be database-backed later)
router.post('/pins', async (req, res) => {
  try {
    const { sentence, source, action } = req.body;
    const tenantId = req.user.tenantId;
    
    // For now, just acknowledge the pin action
    // In a full implementation, this would store to database
    res.json({
      success: true,
      message: `Pin ${action} successful`,
      data: {
        sentence,
        source,
        action,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error managing pin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to manage pin'
    });
  }
});

// Content Creation from Pins
router.post('/create-from-pins', async (req, res) => {
  try {
    const { pins, type = 'strategic' } = req.body;
    const tenantId = req.user.tenantId;
    const { generateAIContent } = require('../services/ai-service');
    const { logUsage } = require('../services/usage-service');
    
    if (!pins || pins.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pins provided'
      });
    }
    
    // Create a prompt from the pinned sentences
    const pinnedTexts = pins.map(pin => pin.text).join(' ');
    const prompt = `Based on these curated insights: "${pinnedTexts}"
    
    Create a comprehensive strategic document that:
    - Synthesizes the key themes and patterns
    - Provides actionable business recommendations
    - Identifies strategic opportunities
    - Suggests implementation approaches
    - Maintains a professional consulting tone
    
    Structure the output with clear sections and strategic insights.`;
    
    const generatedContent = await generateAIContent(prompt, {
      maxTokens: 800,
      temperature: 0.6
    });
    
    // Log usage
    await logUsage(tenantId, 'ai_api_calls', 1);
    await logUsage(tenantId, 'content_creation', 1);
    
    res.json({
      success: true,
      data: {
        content: generatedContent,
        title: `Strategic Content from ${pins.length} Pinned Insights`,
        sourceCount: pins.length,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error creating content from pins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create content from pins'
    });
  }
});

module.exports = router;