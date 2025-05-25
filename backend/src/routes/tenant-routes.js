const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant-controller');
const isSuperAdmin = require('../middleware/super-admin');

// Super admin routes
router.post('/tenants', isSuperAdmin, tenantController.createTenant);
router.get('/tenants', isSuperAdmin, tenantController.getAllTenants);
router.get('/tenants/:id', isSuperAdmin, tenantController.getTenant);
router.patch('/tenants/:id', isSuperAdmin, tenantController.updateTenant);

// Tenant admin routes (protected by tenant middleware)
router.get('/tenant-info', tenantController.getTenantInfo);

module.exports = router;