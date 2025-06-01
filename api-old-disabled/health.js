// Health check endpoint as individual file
export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'VERCEL SERVERLESS ENDPOINT WORKING!',
    timestamp: new Date().toISOString(),
    version: '3.0',
    note: 'Environment variable deleted, forcing fresh deploy'
  });
}