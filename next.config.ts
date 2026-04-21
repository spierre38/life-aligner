import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack crashes on this machine due to missing native SWC bindings
  // (falls back to WASM which doesn't support turbo.createProject).
  // Disable it so `npm run dev` uses the standard webpack bundler.
  experimental: {
    turbo: undefined,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
