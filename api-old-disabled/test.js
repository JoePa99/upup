// Individual Vercel API endpoint
export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Individual API endpoint working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}