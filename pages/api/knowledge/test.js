// Super simple test endpoint for knowledge API
export default function handler(req, res) {
  // Just return success without any processing
  res.status(200).json({
    success: true,
    message: 'Knowledge test endpoint working',
    received: {
      method: req.method,
      body: req.body ? JSON.stringify(req.body).substring(0, 100) : null,
      query: req.query
    }
  });
}