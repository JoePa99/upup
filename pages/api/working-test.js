// Minimal API endpoint guaranteed to work in Vercel
export default function handler(req, res) {
  // Get request info
  const requestInfo = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
  };

  // Get environment info (without exposing secrets)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL === '1',
    VERCEL_ENV: process.env.VERCEL_ENV,
    OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
    SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY
  };

  // Always return success with debug info
  res.status(200).json({
    success: true,
    status: 'SUCCESS',
    message: 'Working test endpoint is functioning correctly',
    timestamp: new Date().toISOString(),
    request: requestInfo,
    environment: envInfo
  });
}