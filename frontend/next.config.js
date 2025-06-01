/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Disable API rewrites in production to let Vercel handle API routes locally
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // Only use API rewrites in development if pointing to external API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && !apiUrl.includes('localhost')) {
      return [
        {
          source: '/api/:path*',
          destination: apiUrl + '/:path*',
        },
      ];
    }
    
    return [];
  },
  // Enable multi-zone support for different subdomains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Image domains for next/image
  images: {
    domains: ['s3.amazonaws.com'],
  },
};

module.exports = nextConfig;