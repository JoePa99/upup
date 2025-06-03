const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge-controller-simple');
const multer = require('multer');

// Simple file upload middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simplified middleware to provide mock auth data if missing
const ensureAuthData = (req, res, next) => {
  if (!req.user) {
    req.user = {
      id: 'dev-user',
      tenantId: 'dev-tenant',
      email: 'dev@example.com',
      role: 'company_admin'
    };
  }
  
  if (!req.tenant) {
    req.tenant = {
      id: 'dev-tenant',
      name: 'Development Tenant',
      subdomain: 'dev'
    };
  }
  
  next();
};

// Apply the simplified auth middleware to all routes
router.use(ensureAuthData);

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Simplified knowledge routes are working!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Company Knowledge Routes
router.post('/company', 
  upload.single('document'),
  knowledgeController.uploadCompanyKnowledge
);
router.get('/company', knowledgeController.getCompanyKnowledge);
router.delete('/company/:id', knowledgeController.deleteKnowledge);

// Session Knowledge Routes
router.post('/session', 
  upload.single('document'),
  knowledgeController.uploadSessionKnowledge
);
router.get('/session', knowledgeController.getSessionKnowledge);
router.delete('/session/:id', knowledgeController.deleteKnowledge);

// Knowledge Context Routes (For AI integration)
router.get('/context', knowledgeController.getKnowledgeContext);

module.exports = router;