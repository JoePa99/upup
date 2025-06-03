const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes - with error handling
let tenantRoutes, authRoutes, usageRoutes, contentRoutes, knowledgeRoutes, knowledgeRoutesSimple, superAdminRoutes;

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

try {
  knowledgeRoutesSimple = require('./routes/knowledge-routes-simple');
  console.log('✅ Simplified knowledge routes loaded');
} catch (err) {
  console.error('❌ Failed to load simplified knowledge routes:', err.message);
}

try {
  superAdminRoutes = require('./routes/super-admin-routes');
  console.log('✅ Super admin routes loaded');
} catch (err) {
  console.error('❌ Failed to load super admin routes:', err.message);
}

// Add simple test routes
let testRoutes;
try {
  testRoutes = require('./routes/test-routes');
  console.log('✅ Test routes loaded');
} catch (err) {
  console.error('❌ Failed to load test routes:', err.message);
}

// Import middleware with error handling
let tenantContext, auth;

try {
  tenantContext = require('./middleware/tenant-context');
  console.log('✅ Tenant context middleware loaded');
} catch (err) {
  console.error('❌ Failed to load tenant context middleware:', err.message);
  tenantContext = (req, res, next) => next(); // Fallback
}

try {
  const authModule = require('./middleware/auth');
  auth = authModule.auth;
  console.log('✅ Auth middleware loaded');
} catch (err) {
  console.error('❌ Failed to load auth middleware:', err.message);
  auth = (req, res, next) => next(); // Fallback
}

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Performance test endpoint
app.get('/api/ping', (req, res) => {
  const start = Date.now();
  // Simulate a very small amount of work
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += i;
  }
  const duration = Date.now() - start;
  
  res.status(200).json({ 
    ping: 'pong', 
    serverTime: new Date().toISOString(),
    processingTime: `${duration}ms`,
    load: process.uptime()
  });
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

// Inline content generation test (bypass external routes)
app.post('/api/inline-content-test', (req, res) => {
  res.json({
    success: true,
    message: 'Inline content route works!',
    data: {
      content: 'This is a test response to verify POST routes work',
      title: 'Test Content',
      timestamp: new Date().toISOString()
    }
  });
});

// Inline knowledge test (bypass external routes)
app.post('/api/inline-knowledge-test', (req, res) => {
  res.json({
    success: true,
    message: 'Inline knowledge route works!',
    data: {
      id: Date.now(),
      title: req.body.title || 'Test Knowledge',
      content: req.body.content || 'Test content for knowledge base',
      created_at: new Date().toISOString()
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
console.log('🚀 Starting route registration...');

try {
  if (testRoutes) {
    app.use('/api/test', testRoutes);
    console.log('✅ Test routes registered');
  }
  
  if (contentRoutes) {
    app.use('/api/content', contentRoutes);
    console.log('✅ Content routes registered');
  }
  
  if (knowledgeRoutesSimple) {
    app.use('/api/knowledge', knowledgeRoutesSimple);
    console.log('✅ Simplified knowledge routes registered (primary)');
  } else if (knowledgeRoutes) {
    app.use('/api/knowledge', knowledgeRoutes);
    console.log('✅ Standard knowledge routes registered (fallback)');
  }
  
  if (superAdminRoutes) {
    app.use('/api/super-admin', superAdminRoutes);
    console.log('✅ Super admin routes registered');
  }
  
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
  
  console.log('🎉 Route registration completed');
} catch (err) {
  console.error('💥 Route registration failed:', err.message);
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