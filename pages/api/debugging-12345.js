// Completely unique endpoint name to avoid any conflicts
export default function handler(req, res) {
  res.status(200).json({
    message: 'UNIQUE DEBUGGING ENDPOINT WORKING!',
    timestamp: new Date().toISOString(),
    endpoint: 'debugging-12345',
    note: 'This endpoint has a unique name that could not conflict with anything'
  });
}