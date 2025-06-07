export default function handler(req, res) {
  console.log('Simple test endpoint accessed:', req.method);
  
  if (req.method === 'POST') {
    return res.status(200).json({ 
      success: true,
      message: 'POST request works',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true,
      message: 'GET request works',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ 
    message: 'Method not allowed',
    method: req.method
  });
}