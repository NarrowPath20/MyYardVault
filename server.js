import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {showWebsite} from './src/controllers/page-controller.js';
import {pageForPath} from './src/models/pages.js';
import {leadConfig} from './src/server/lead-config.js';
import {createLeadApi} from './src/server/lead-api.js';

const root = fileURLToPath(new URL('./', import.meta.url));
const types = {'.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif'};

export function createAppServer({leadOptions = {}} = {}) {
  const config = leadOptions.config || leadConfig();
  const handleLeadRequest = createLeadApi(config, leadOptions);
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (await handleLeadRequest(request, response, pathname)) return;
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, {Allow: 'GET, HEAD'}); response.end(); return;
      }
      if (pathname === '/index.html' || (pathname !== '/' && pathname.endsWith('/') && pageForPath(pathname.slice(0, -1)))) {
        const url = new URL(request.url, 'http://localhost');
        response.writeHead(308, {Location: (pathname === '/index.html' ? '/' : pathname.slice(0, -1)) + url.search});
        response.end(); return;
      }
      const page = pageForPath(pathname);
      if (page) {
        showWebsite(request, response, page); return;
      }
      const module = /^\/(controllers|models|views\/renderers)\/[^/]+\.js$/.test(pathname);
      const base = resolve(root, module ? 'src' : 'public');
      const target = resolve(base, `.${pathname}`);
      if (!target.startsWith(base + sep)) {
        response.writeHead(403); response.end('Forbidden'); return;
      }
      const data = await readFile(target);
      response.writeHead(200, {'Content-Type': types[extname(target)] || 'application/octet-stream'});
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch (error) {
      const missing = error.code === 'ENOENT' || error.code === 'EISDIR';
      response.writeHead(missing ? 404 : error instanceof URIError ? 400 : 500);
      response.end(missing ? 'Not found' : 'Unable to serve request');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  createAppServer().listen(port, '127.0.0.1', () => console.log(`Yard Vault: http://localhost:${port}`));
}
