import {createServer} from 'node:http';
import {seedHandler, signHandler} from './handlers.js';

const PORT = Number(process.env.PORT) || 3001;

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

const ROUTES = {
  'POST /seed': () => seedHandler(),
  'POST /sign': (body) => signHandler(body),
};

async function handle(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const route = `${req.method} ${req.url}`;
  const handler = ROUTES[route];
  if (!handler) {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  const body = await readJsonBody(req);
  if (req.method === 'POST' && body === null) {
    res.writeHead(400);
    res.end('invalid json');
    return;
  }

  const result = handler(body);
  if (result === null) {
    res.writeHead(403);
    res.end('rejected');
    return;
  }
  res.writeHead(200);
  res.end(result);
}

const server = createServer(handle);
server.listen(PORT, () => {
  console.log(`genuine listening on http://localhost:${PORT}`);
});
