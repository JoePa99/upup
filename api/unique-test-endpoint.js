export default function handler(req, res) {
  res.status(200).json({
    message: 'UNIQUE TEST ENDPOINT IS WORKING!',
    timestamp: new Date().toISOString(),
    method: req.method,
    success: true,
    endpoint: 'unique-test-endpoint'
  });
}