// Vercel API entry point
// This file acts as the main handler for all /api/* routes

const app = require('../backend/src/server');

// Export the Express app for Vercel
module.exports = app;