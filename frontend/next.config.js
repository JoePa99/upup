/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed API rewrites - let Vercel handle API routes directly
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
  //     },
  //   ];
  // },
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