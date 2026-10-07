import {cp, mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, join, dirname} from 'node:path';
import {renderWebsite} from '../src/controllers/page-controller.js';
import {PAGES} from '../src/models/pages.js';

const root = fileURLToPath(new URL('../', import.meta.url));

// Pages supplies its configured base path, including custom-domain deployments.
export async function buildPages({basePath = process.env.PAGES_BASE_PATH || '/', output = resolve(root, 'dist')} = {}) {
  if (!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(basePath)) {
    throw new Error('PAGES_BASE_PATH must start and end with / and contain only URL-safe path segments.');
  }
  const routes = new Set(Object.values(PAGES).map(page => page.path));
  function rewriteUrl(url) {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    const [path] = url.split(/[?#]/);
    if (routes.has(path)) return basePath + path.slice(1) + (path === '/' ? '' : '/') + url.slice(path.length);
    if (/^\/(assets\/|controllers\/|models\/|views\/|app\.js|theme\.js)/.test(url)) return basePath + url.slice(1);
    return url;
  }
  // Rewrite root URLs in HTML, CSS, model data, and module imports (including templates).
  const rewrite = source => source.replace(/(["'`(])(\/[^"'`\s)<>]*)/g, (_, delimiter, url) => delimiter + rewriteUrl(url));
  await mkdir(output, {recursive: true});
  await cp(resolve(root, 'public'), output, {recursive: true});
  for (const folder of ['controllers', 'models', 'views/renderers']) {
    await cp(resolve(root, 'src', folder), join(output, folder), {
      recursive: true,
      filter: source => !source.endsWith('page-controller.js')
    });
  }
  async function rewriteFiles(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await rewriteFiles(path);
      else if (/\.(js|css)$/.test(entry.name)) await writeFile(path, rewrite(await readFile(path, 'utf8')));
    }
  }
  await rewriteFiles(output);
  for (const [key, page] of Object.entries(PAGES)) {
    const path = join(output, page.path.slice(1), 'index.html');
    await mkdir(dirname(path), {recursive: true});
    await writeFile(path, rewrite(renderWebsite(key)).replace('<body ', '<body data-hosting="static" '));
  }
  await writeFile(join(output, '.nojekyll'), '');
  await writeFile(join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>Page not found</h1><a href="' + basePath + '">Return to My Yard Vault</a></html>');
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Built GitHub Pages site in ${await buildPages()}`);
}
