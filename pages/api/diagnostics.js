// Diagnostic endpoint to help troubleshoot deployment issues
import fs from 'fs';
import path from 'path';
import os from 'os';

export default function handler(req, res) {
  // Get basic system info
  const systemInfo = {
    platform: process.platform,
    nodeVersion: process.version,
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    memory: process.memoryUsage(),
    cpus: os.cpus().length,
    hostname: os.hostname(),
    tmpdir: os.tmpdir()
  };
  
  // Check if we can write to tmp directory
  let tmpWritable = false;
  const testFile = path.join(os.tmpdir(), 'test-write-' + Date.now());
  try {
    fs.writeFileSync(testFile, 'test');
    tmpWritable = fs.existsSync(testFile);
    try {
      fs.unlinkSync(testFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (e) {
    // Can't write to tmp
  }
  
  // Check for various environment variables (don't expose actual values)
  const envStatus = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    S3_BUCKET: !!process.env.S3_BUCKET,
    AWS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY,
    TMP_DIR_WRITABLE: tmpWritable
  };
  
  // Check for common Node modules
  const modules = [
    'express', 
    'next', 
    'react', 
    'formidable', 
    'pdf-parse', 
    'openai', 
    '@supabase/supabase-js'
  ];
  
  const moduleStatus = {};
  
  modules.forEach(module => {
    try {
      require.resolve(module);
      moduleStatus[module] = true;
    } catch (e) {
      moduleStatus[module] = false;
    }
  });
  
  // Return all diagnostics
  res.status(200).json({
    success: true,
    message: 'Diagnostic information',
    system: systemInfo,
    environment: envStatus,
    modules: moduleStatus,
    timestamp: new Date().toISOString(),
    requestHeaders: req.headers
  });
}