import {defineConfig} from 'vite';
import {existsSync, readFileSync, readdirSync} from 'node:fs';

const GENUINE_DEV_URL = process.env.GENUINE_URL ?? 'http://localhost:3001';
const THROTTLE_MS = Number(process.env.THROTTLE_MS) || 0;

// Web Crypto's Ed25519 verify only runs in a Secure Context. localhost
// qualifies; a plain-HTTP LAN IP does not — so signature verification
// silently fails and the chain walk yields null. To test on a LAN IP
// (e.g. for Network Link Conditioner from another device), generate a
// mkcert leaf cert in this directory: `mkcert -install` once, then
// `mkcert <lan-ip> localhost`. Vite picks up any *.pem pair below.
const certPair = readdirSync('.')
  .filter((f) => f.endsWith('.pem') && !f.endsWith('-key.pem'))
  .map((cert) => [cert, cert.replace(/\.pem$/, '-key.pem')])
  .find(([c, k]) => existsSync(c) && existsSync(k));
const https = certPair
  ? {cert: readFileSync(certPair[0]), key: readFileSync(certPair[1])}
  : undefined;

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    https,
    proxy: {
      '/seed': GENUINE_DEV_URL,
      '/sign': GENUINE_DEV_URL,
    },
  },
  plugins: THROTTLE_MS ? [{
    name: 'dev-throttle',
    configureServer(server) {
      server.middlewares.use((_req, _res, next) => setTimeout(next, THROTTLE_MS));
    },
  }] : [],
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
