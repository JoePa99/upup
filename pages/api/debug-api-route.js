// API route for debugging API issues step by step
export default function handler(req, res) {
  // Step 1: Basic functionality
  const step1 = {
    success: true,
    message: 'Step 1: Basic API route is working',
    method: req.method,
    path: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  };
  
  // Step 2: Access environment variables
  let step2;
  try {
    step2 = {
      success: true,
      message: 'Step 2: Environment variables are accessible',
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      // Don't show actual values, just if they exist
      has_database_url: !!process.env.DATABASE_URL,
      has_openai_key: !!process.env.OPENAI_API_KEY
    };
  } catch (error) {
    step2 = {
      success: false,
      message: 'Step 2: Error accessing environment variables',
      error: error.message
    };
  }
  
  // Step 3: Import third-party libraries
  let step3;
  try {
    // Try to resolve various modules without actually importing them
    const modules = [
      'next', 'react', 'formidable', 'openai', '@supabase/supabase-js', 
      'pdf-parse', 'fs', 'path'
    ];
    
    const moduleStatus = {};
    modules.forEach(mod => {
      try {
        require.resolve(mod);
        moduleStatus[mod] = true;
      } catch (e) {
        moduleStatus[mod] = false;
      }
    });
    
    step3 = {
      success: true,
      message: 'Step 3: Module resolution check',
      modules: moduleStatus
    };
  } catch (error) {
    step3 = {
      success: false,
      message: 'Step 3: Error checking modules',
      error: error.message
    };
  }
  
  // Step 4: Try a minimal formidable import (don't actually use it)
  let step4;
  try {
    // This just checks if formidable can be imported but doesn't use it
    let formidableImported = false;
    try {
      require('formidable');
      formidableImported = true;
    } catch (e) {
      // Ignore error
    }
    
    step4 = {
      success: true,
      message: 'Step 4: Formidable import check',
      formidable_imported: formidableImported
    };
  } catch (error) {
    step4 = {
      success: false,
      message: 'Step 4: Error checking formidable',
      error: error.message
    };
  }
  
  // Return all steps to see where things might be failing
  res.status(200).json({
    success: true,
    message: 'API route diagnostic steps',
    steps: {
      step1,
      step2,
      step3,
      step4
    }
  });
}