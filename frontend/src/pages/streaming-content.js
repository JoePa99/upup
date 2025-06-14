import StreamingContentGenerator from '../components/StreamingContentGenerator';
import Layout from '../components/Layout';

export default function StreamingContentPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">🚀 Streaming Content Generator</h1>
        <p className="text-gray-600 mb-6">
          Experience real-time AI content generation with streaming responses
        </p>
        <StreamingContentGenerator />
      </div>
    </Layout>
  );
}