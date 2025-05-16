import type { NextConfig } from 'next'

const allowedHostnames = [
  'cdn3.centrecom.com.au',
  'files.pccasegear.com',
  'cdn1.centrecom.com.au',
  'cdn0.centrecom.com.au',
  'cdn2.centrecom.com.au',
  'prod.scorptec.com.au',
  'www.scorptec.com.au',
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: allowedHostnames.map(hostname => ({ hostname })),
  },
}

export default nextConfig
