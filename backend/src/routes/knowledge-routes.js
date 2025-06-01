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

// Company Knowledge Routes (Company Admin only)
router.post('/company', 
  requireCompanyAdmin, 
  documentService.uploadMiddleware, 
  knowledgeController.uploadCompanyKnowledge
);
router.get('/company', knowledgeController.getCompanyKnowledge); // All users can view
router.delete('/company/:id', requireCompanyAdmin, knowledgeController.deleteKnowledge);

// Session Knowledge Routes (All authenticated users)
router.post('/session', 
  documentService.uploadMiddleware, 
  knowledgeController.uploadSessionKnowledge
);
router.get('/session', knowledgeController.getSessionKnowledge);
router.delete('/session/:id', knowledgeController.deleteKnowledge);

// Knowledge Context Routes (For AI integration)
router.get('/context', knowledgeController.getKnowledgeContext);

// Direct file upload endpoint for testing
router.post('/upload', 
  hasRole(['company_admin', 'admin', 'user']), 
  documentService.uploadMiddleware,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const processedDoc = await documentService.processDocument(
        req.file,
        req.user.tenantId,
        req.user.id,
        'upload'
      );

      res.json({
        success: true,
        data: processedDoc,
        message: 'File uploaded and processed successfully'
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'File upload failed'
      });
    }
  }
);

module.exports = router;