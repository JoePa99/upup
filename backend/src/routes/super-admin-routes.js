const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/super-admin-controller');
const isSuperAdmin = require('../middleware/super-admin');
const documentService = require('../services/document-service');

// All routes require super admin authentication
router.use(isSuperAdmin);

// Super admin verification endpoint
router.get('/verify', superAdminController.verifySuperAdmin);

// Analytics routes
router.get('/analytics', superAdminController.getPlatformAnalytics);

// Tenant management routes
router.get('/companies', superAdminController.getAllTenants);
router.post('/companies', superAdminController.createTenant);
router.put('/companies/:id', superAdminController.updateTenant);

// Platform knowledge routes
router.get('/knowledge', superAdminController.getPlatformKnowledge);
router.post('/knowledge', 
  documentService.uploadMiddleware,
  superAdminController.createPlatformKnowledge
);
router.delete('/knowledge/:id', superAdminController.deletePlatformKnowledge);

module.exports = router;