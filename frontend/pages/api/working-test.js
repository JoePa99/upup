export default function handler(req, res) {
  res.json({ 
    status: 'SUCCESS',
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
}