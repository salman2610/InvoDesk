/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@invodesk/types',
    '@invodesk/gst',
    '@invodesk/billing',
    '@invodesk/inventory',
    '@invodesk/sync'
  ],
  async rewrites() {
    const apiPort = process.env.API_PORT || '4000';
    return [
      {
        source: '/pos',
        destination: '/',
      },
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${apiPort}/api/:path*`,
      },
    ];
  }
};

module.exports = nextConfig;
