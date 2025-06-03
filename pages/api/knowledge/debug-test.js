// Simple debug endpoint for knowledge API testing
export default function handler(req, res) {
  // Capture all request info for debugging
  const requestInfo = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    cookies: req.cookies,
  };

  // Always return success with debug information
  res.status(200).json({
    success: true,
    message: 'Knowledge API debug endpoint is working',
    timestamp: new Date().toISOString(),
    request: requestInfo,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
      SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY
    }
  });
}