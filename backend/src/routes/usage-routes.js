const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usage-controller');
const { auth, requireAdmin } = require('../middleware/auth');

// Get tenant usage statistics (tenant admin only)
router.get('/usage', auth, requireAdmin, usageController.getTenantUsage);

module.exports = router;