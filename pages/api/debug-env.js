export default async function handler(req, res) {
  // Debug environment variables
  const envDebug = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL || 'not set'
  };

  return res.status(200).json({
    message: 'Environment debug info',
    env: envDebug,
    method: req.method
  });
}