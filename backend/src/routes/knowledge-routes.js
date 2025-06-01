const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge-controller');
const { auth, requireCompanyAdmin, hasRole } = require('../middleware/auth');
const tenantContext = require('../middleware/tenant-context');
// Temporarily comment out document service to test
// const documentService = require('../services/document-service');

// Development mode - skip auth if no JWT_SECRET or in development without database
const isDevelopmentWithoutDB = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

if (!isDevelopmentWithoutDB) {
  // Apply authentication and tenant context to all routes in production
  router.use(auth);
  router.use(tenantContext);
} else {
  // Development mode - add mock user and tenant
  router.use((req, res, next) => {
    req.user = {
      id: 'dev-user-1',
      tenantId: 'dev-tenant-1',
      email: 'dev@example.com',
      role: 'company_admin' // Give admin role for testing
    };
    req.tenant = {
      id: 'dev-tenant-1',
      name: 'Development Tenant',
      subdomain: 'dev'
    };
    next();
  });
}

// Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Knowledge routes are working!',
    user: req.user || 'No user context',
    isDevelopment: process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL,
    timestamp: new Date().toISOString()
  });
});

// Company Knowledge Routes (Company Admin only) - TEMPORARILY WITHOUT FILE UPLOAD
router.post('/company', 
  requireCompanyAdmin, 
  knowledgeController.uploadCompanyKnowledge
);
router.get('/company', knowledgeController.getCompanyKnowledge); // All users can view
router.delete('/company/:id', requireCompanyAdmin, knowledgeController.deleteKnowledge);

// Session Knowledge Routes (All authenticated users) - TEMPORARILY WITHOUT FILE UPLOAD
router.post('/session', 
  knowledgeController.uploadSessionKnowledge
);
router.get('/session', knowledgeController.getSessionKnowledge);
router.delete('/session/:id', knowledgeController.deleteKnowledge);

// Knowledge Context Routes (For AI integration)
router.get('/context', knowledgeController.getKnowledgeContext);

// Placeholder file upload endpoint
router.post('/upload', 
  hasRole(['company_admin', 'admin', 'user']), 
  async (req, res) => {
    res.json({
      success: false,
      message: 'File upload temporarily disabled for debugging - use text input instead'
    });
  }
);

module.exports = router;