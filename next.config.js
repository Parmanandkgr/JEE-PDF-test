/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/JEE-PDF-test',
  assetPrefix: '/JEE-PDF-test/',
};

module.exports = nextConfig;
