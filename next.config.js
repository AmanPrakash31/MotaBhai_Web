
import {config} from 'dotenv';
config({path: './.env'});

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  /* config options here */
   experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' ,
              hostname: supabaseHostname,
              port: '',
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
