/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',

    // WebSocket support for collaboration
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // Allow Supabase Storage URLs for images
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },

    // Webpack config for PDF.js worker
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

module.exports = nextConfig;
