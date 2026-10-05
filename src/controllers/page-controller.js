import {renderView} from '../views/render.js';
import {PAGES} from '../models/pages.js';

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

export function renderWebsite(key = 'home') {
  const page = PAGES[key];
  const standalone = ['build', 'sizes', 'gallery', 'contact'].includes(key);
  const data = {
    pageKey: key,
    pageTitle: escapeHtml(page.title),
    pageDescription: escapeHtml(page.description),
    bodyClass: `${key === 'home' ? '' : `on-${key}`} ${standalone ? 'standalone-page' : ''}`.trim(),
    pageAssets: ['home', 'storage'].includes(key) ? renderView(`partials/${key}-background`) : '',
    pageContent: renderView(`pages/${key}`),
    pageScripts: key === 'home' ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>' : ''
  };
  return renderView('layout', data);
}

export function showWebsite(request, response, key = 'home') {
  response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  response.end(request.method === 'HEAD' ? undefined : renderWebsite(key));
}
