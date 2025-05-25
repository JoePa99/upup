const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');

// Tenant user authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Super admin authentication routes
router.post('/admin/login', authController.superAdminLogin);

// Initial setup route (no auth required - only works if no super admin exists)
router.post('/setup/super-admin', authController.createSuperAdmin);

module.exports = router;