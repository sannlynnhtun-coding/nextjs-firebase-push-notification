/** @type {import('next').NextConfig} */
const withOffline = require("next-offline");

const nextConfig = {
  reactStrictMode: true,
  // Ensure service worker is accessible
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

module.exports = withOffline(nextConfig);
