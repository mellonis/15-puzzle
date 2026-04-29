import {createPrivateKey, sign as nodeSign} from 'node:crypto';

// DEV-ONLY fallback. Production must set PRIVATE_KEY env to a PEM-encoded
// Ed25519 private key. The matching public key (base64url-encoded raw 32
// bytes) lives in static/src/services/server.js as DEV_PUBLIC_KEY.
const DEV_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIAQRRGHXgG45dNha6gnbG3b+S0ZTZuxp/tCAU0TOj+Ys
-----END PRIVATE KEY-----
`;

const privateKey = createPrivateKey(process.env.PRIVATE_KEY ?? (() => {
  console.warn('[genuine] PRIVATE_KEY not set, using DEV key');
  return DEV_PRIVATE_KEY;
})());

// Returns a 128-char hex string (64-byte Ed25519 signature).
export function sign(message) {
  return nodeSign(null, Buffer.from(message, 'utf8'), privateKey).toString('hex');
}
