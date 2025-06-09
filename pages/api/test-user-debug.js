import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { email, name, companyId, role = 'user' } = req.body;

      // Return detailed debug info instead of proceeding with creation
      return res.status(200).json({
        success: true,
        debug: {
          receivedBody: req.body,
          extractedFields: { email, name, companyId, role },
          validation: {
            hasEmail: !!email,
            hasName: !!name,
            hasCompanyId: !!companyId,
            emailType: typeof email,
            nameType: typeof name,
            companyIdType: typeof companyId
          },
          headers: {
            contentType: req.headers['content-type'],
            authorization: req.headers.authorization ? 'present' : 'missing'
          }
        }
      });

    } catch (error) {
      return res.status(500).json({
        message: 'Debug endpoint error',
        error: error.message,
        receivedBody: req.body
      });
    }
  }
  
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({
    message: 'Method not allowed',
    method: req.method
  });
}