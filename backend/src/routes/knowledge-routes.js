const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge-controller');
const { auth, requireCompanyAdmin, hasRole } = require('../middleware/auth');
const tenantContext = require('../middleware/tenant-context');

// Apply authentication and tenant context to all routes
router.use(auth);
router.use(tenantContext);

// Company Knowledge Routes (Company Admin only)
router.post('/company', requireCompanyAdmin, knowledgeController.uploadCompanyKnowledge);
router.get('/company', knowledgeController.getCompanyKnowledge); // All users can view
router.delete('/company/:id', requireCompanyAdmin, knowledgeController.deleteKnowledge);

// Session Knowledge Routes (All authenticated users)
router.post('/session', knowledgeController.uploadSessionKnowledge);
router.get('/session', knowledgeController.getSessionKnowledge);
router.delete('/session/:id', knowledgeController.deleteKnowledge);

// Knowledge Context Routes (For AI integration)
router.get('/context', knowledgeController.getKnowledgeContext);

// File Upload Routes (placeholder for future file handling)
router.post('/upload', hasRole(['company_admin', 'admin', 'user']), async (req, res) => {
  // TODO: Implement file upload with multer and S3
  res.json({
    success: false,
    message: 'File upload endpoint not yet implemented',
    note: 'Will support PDF, DOCX, TXT files with automatic content extraction'
  });
});

module.exports = router;