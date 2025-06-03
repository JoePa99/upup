// Simple endpoint to return the Supabase URL for client-side use
export default function handler(req, res) {
  // Get values from environment
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Return only what's needed for client-side initialization
  res.status(200).json({
    success: true,
    supabaseUrl: supabaseUrl,
    hasAnonKey: !!anonKey,
    environment: {
      NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY
    }
  });
}