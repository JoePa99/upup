const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const tenantRoutes = require('./routes/tenant-routes');
const authRoutes = require('./routes/auth-routes');
const usageRoutes = require('./routes/usage-routes');
const contentRoutes = require('./routes/content-routes');
const knowledgeRoutes = require('./routes/knowledge-routes');

// Import middleware
const tenantContext = require('./middleware/tenant-context');
const { auth } = require('./middleware/auth');

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Public tenant routes (like authentication)
app.use('/api/tenant', tenantContext, authRoutes);

// Protected tenant routes
app.use('/api/tenant', tenantContext, auth, tenantRoutes);
app.use('/api/tenant', tenantContext, usageRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Super admin routes
app.use('/api/admin', authRoutes);
app.use('/api/admin', tenantRoutes);

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'UPUP API Server' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server'
  });
});

// Start server (only if not in Vercel environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;