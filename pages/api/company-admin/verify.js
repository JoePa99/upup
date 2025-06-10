// Simple verification endpoint for company admin access
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Use the established auth helper that works with our authentication system
    const { getUserFromRequest } = await import('../../../utils/auth-helpers.js');
    
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has company admin role
    const isCompanyAdmin = user.role === 'company_admin' || user.role === 'admin';
    
    if (!isCompanyAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Company admin access required'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Company admin access verified',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        companyName: user.company_name
      }
    });
  } catch (error) {
    console.error('Company admin verification error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}