export default function handler(req, res) {
  res.status(200).json({
    message: 'UNIQUE TEST ENDPOINT IS WORKING AFTER ENV VAR DELETION!',
    timestamp: new Date().toISOString(),
    method: req.method,
    success: true,
    endpoint: 'unique-test-endpoint',
    freshDeploy: true
  });
}