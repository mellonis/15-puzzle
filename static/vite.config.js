import {defineConfig} from 'vite';

const GENUINE_DEV_URL = process.env.GENUINE_URL ?? 'http://localhost:3001';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/seed': GENUINE_DEV_URL,
      '/sign': GENUINE_DEV_URL,
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (info) => {
          const ext = info.names?.[0]?.split('.').pop() ?? '';
          if (ext === 'webp') return 'assets/[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
