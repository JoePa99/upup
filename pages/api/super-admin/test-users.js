export default async function handler(req, res) {
  console.log('Test users endpoint accessed:', req.method);
  
  if (req.method === 'POST') {
    return res.status(200).json({ 
      success: true, 
      message: 'POST method working',
      body: req.body 
    });
  }
  
  return res.status(200).json({ 
    success: true, 
    message: 'Test endpoint working',
    method: req.method 
  });
}