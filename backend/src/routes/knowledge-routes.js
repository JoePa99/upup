const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge-controller');
const { auth, requireCompanyAdmin, hasRole } = require('../middleware/auth');
const tenantContext = require('../middleware/tenant-context');
const documentService = require('../services/document-service');

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

// Company Knowledge Routes (Company Admin only)
router.post('/company', 
  requireCompanyAdmin, 
  documentService.uploadMiddleware,  // Add multer middleware for file uploads
  knowledgeController.uploadCompanyKnowledge
);
router.get('/company', knowledgeController.getCompanyKnowledge); // All users can view
router.delete('/company/:id', requireCompanyAdmin, knowledgeController.deleteKnowledge);

// Session Knowledge Routes (All authenticated users)
router.post('/session', 
  documentService.uploadMiddleware,  // Add multer middleware for file uploads
  knowledgeController.uploadSessionKnowledge
);
router.get('/session', knowledgeController.getSessionKnowledge);
router.delete('/session/:id', knowledgeController.deleteKnowledge);

// Knowledge Context Routes (For AI integration)
router.get('/context', knowledgeController.getKnowledgeContext);

// Platform Knowledge Routes (Super Admin only)
router.get('/platform', (req, res) => {
  // This will be implemented later as part of Super Admin features
  res.json({
    success: true,
    data: {
      knowledge: [],
      message: 'Platform knowledge API not yet implemented'
    }
  });
});

module.exports = router;