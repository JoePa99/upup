const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes - with error handling
let tenantRoutes, authRoutes, usageRoutes, contentRoutes, knowledgeRoutes;

try {
  tenantRoutes = require('./routes/tenant-routes');
  console.log('✅ Tenant routes loaded');
} catch (err) {
  console.error('❌ Failed to load tenant routes:', err.message);
}

try {
  authRoutes = require('./routes/auth-routes');
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.error('❌ Failed to load auth routes:', err.message);
}

try {
  usageRoutes = require('./routes/usage-routes');
  console.log('✅ Usage routes loaded');
} catch (err) {
  console.error('❌ Failed to load usage routes:', err.message);
}

try {
  contentRoutes = require('./routes/content-routes');
  console.log('✅ Content routes loaded');
} catch (err) {
  console.error('❌ Failed to load content routes:', err.message);
}

try {
  knowledgeRoutes = require('./routes/knowledge-routes');
  console.log('✅ Knowledge routes loaded');
} catch (err) {
  console.error('❌ Failed to load knowledge routes:', err.message);
}

// Add simple test routes
let testRoutes;
try {
  testRoutes = require('./routes/test-routes');
  console.log('✅ Test routes loaded');
} catch (err) {
  console.error('❌ Failed to load test routes:', err.message);
}

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

// Simple inline test endpoint
app.get('/api/simple-test', (req, res) => {
  res.json({
    message: 'Simple inline route is working!',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DATABASE_URL_SET: !!process.env.DATABASE_URL
    }
  });
});

// Debug endpoint to check routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) { // routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Available routes',
    routes,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DATABASE_URL_SET: !!process.env.DATABASE_URL
    }
  });
});

// Register routes only if they loaded successfully
if (authRoutes) {
  app.use('/api/tenant', tenantContext, authRoutes);
  app.use('/api/admin', authRoutes);
  console.log('✅ Auth routes registered');
}

if (tenantRoutes) {
  app.use('/api/tenant', tenantContext, auth, tenantRoutes);
  app.use('/api/admin', tenantRoutes);
  console.log('✅ Tenant routes registered');
}

if (usageRoutes) {
  app.use('/api/tenant', tenantContext, usageRoutes);
  console.log('✅ Usage routes registered');
}

if (contentRoutes) {
  app.use('/api/content', contentRoutes);
  console.log('✅ Content routes registered');
}

if (knowledgeRoutes) {
  app.use('/api/knowledge', knowledgeRoutes);
  console.log('✅ Knowledge routes registered');
}

if (testRoutes) {
  app.use('/api/test', testRoutes);
  console.log('✅ Test routes registered');
}

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