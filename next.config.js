/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        PRISMA_CLIENT_ENGINE_TYPE: 'library',
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
}

module.exports = nextConfig