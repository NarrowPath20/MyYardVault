import {renderView} from '../views/render.js';
import {PAGES, POLICY_PAGES} from '../models/pages.js';

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

export function showWebsite(request, response, key = 'home') {
  const page = PAGES[key];
  const standalone = [...POLICY_PAGES, 'build', 'sizes', 'gallery', 'contact'].includes(key);
  const legalName = process.env.BUSINESS_LEGAL_NAME?.trim();
  const address = process.env.BUSINESS_POSTAL_ADDRESS?.trim();
  const business = {
    legalIdentity:legalName ? escapeHtml(legalName) : 'Ask our team for the seller’s full legal name before ordering.',
    postalAddress:address ? escapeHtml(address) : 'Ask our team for the current business mailing address before ordering.'
  };
  const data = {
    pageKey: key,
    pageTitle: escapeHtml(page.title),
    pageDescription: escapeHtml(page.description),
    bodyClass: `${key === 'home' ? '' : `on-${key}`} ${standalone ? 'standalone-page' : ''}`.trim(),
    pageAssets: ['home', 'storage'].includes(key) ? renderView(`partials/${key}-background`) : '',
    pageContent: renderView(`pages/${key}`, business),
    quoteDisclosure:POLICY_PAGES.includes(key) ? '' : renderView('partials/quote-disclosure'),
    pageScripts: key === 'home' ? '<script src="/assets/vendor/three.min.js"></script>' : ''
  };
  response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  response.end(request.method === 'HEAD' ? undefined : renderView('layout', data));
}
