import type { NextConfig } from 'next';

const config: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'ws'];
    }

    // WebSocket bağımlılıkları için
    config.externals = [...(config.externals || []), {
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    }];

    return config;
  },
  // API route'ları için
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default config;