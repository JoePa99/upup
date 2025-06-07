export default async function handler(req, res) {
  console.log('Test user create endpoint accessed:', req.method, req.url);
  
  if (req.method === 'POST') {
    console.log('POST request received with body:', req.body);
    return res.status(200).json({ 
      success: true, 
      message: 'Test user creation endpoint working',
      method: req.method,
      body: req.body
    });
  }
  
  return res.status(200).json({ 
    success: true, 
    message: 'Test endpoint accessible',
    method: req.method 
  });
}