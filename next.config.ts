import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'cdn3.centrecom.com.au' },
      { hostname: 'files.pccasegear.com' },
      { hostname: 'cdn1.centrecom.com.au' },
      { hostname: 'cdn0.centrecom.com.au' },
      { hostname: 'cdn2.centrecom.com.au' },
    ],
  },
};

export default nextConfig;
