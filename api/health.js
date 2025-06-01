// Health check endpoint as individual file
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'NEW individual health endpoint working!',
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
}