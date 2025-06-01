// Test endpoint in Next.js pages/api directory
export default function handler(req, res) {
  res.status(200).json({
    message: 'NEXT.JS API ROUTE WORKING!',
    timestamp: new Date().toISOString(),
    location: 'frontend/pages/api/test-nextjs.js',
    success: true
  });
}