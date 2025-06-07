export default function handler(req, res) {
  console.log('Health endpoint called:', req.method, new Date().toISOString());
  
  res.status(200).json({
    status: 'ok',
    method: req.method,
    timestamp: new Date().toISOString(),
    message: 'API is working'
  });
}