// Simplest possible API route test
export default function handler(req, res) {
  res.status(200).json({ name: 'John Doe', message: 'Hello from Next.js API!' });
}