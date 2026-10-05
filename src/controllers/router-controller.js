import {LEGACY_PATHS} from '../models/pages.js';

export function initRouter() {
  // Preserve old bookmarks; normal navigation uses browser page loads.
  const legacy = LEGACY_PATHS[location.hash.slice(1)];
  if (location.pathname === '/' && legacy && legacy !== '/') {
    location.replace(legacy + location.search);
    return true;
  }
  document.querySelectorAll('a[href]').forEach(link => {
    const destination = new URL(link.href, location.href);
    if (destination.origin === location.origin && destination.pathname === location.pathname && !destination.hash) {
      link.setAttribute('aria-current', 'page');
    }
  });
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.dataset.scroll);
      if (target) { event.preventDefault(); target.scrollIntoView({behavior: 'smooth'}); }
    });
  });
  const panel = new URLSearchParams(location.search).get('panel');
  if (document.body.dataset.page === 'contact' && panel) window.__selectPanel?.(panel);
  return false;
}
