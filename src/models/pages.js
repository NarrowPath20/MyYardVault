export const PAGES = {
  home: {path: '/', title: 'Yard Vault — Flat-Pack Steel Storage', description: 'Flat-pack galvanized steel storage, offices, kiosks, and shipping containers for the Four Corners.'},
  storage: {path: '/storage', title: 'Backyard Storage Vaults | Yard Vault', description: 'Explore flat-pack steel backyard storage, finishes, door configurations, and sizes.'},
  office: {path: '/office', title: 'Office Units | Yard Vault', description: 'Finished steel office units for job sites, field operations, and growing businesses.'},
  kiosk: {path: '/kiosk', title: 'Retail Kiosks | Yard Vault', description: 'Explore portable retail kiosks, service windows, and storefront configurations.'},
  multi: {path: '/multi-unit', title: 'Multi-Compartment Units | Yard Vault', description: 'Separately lockable steel storage bays, configurations, and rental income estimates.'},
  conex: {path: '/shipping-containers', title: 'Shipping Containers | Yard Vault', description: 'Explore one-trip shipping containers, sizes, specifications, and delivery options.'},
  accessories: {path: '/accessories', title: 'Storage Accessories | Yard Vault', description: 'Shelving, pipe racks, locking hardware, lighting, and ventilation for your Yard Vault.'},
  build: {path: '/built-on-site', title: 'Built on Site | Yard Vault', description: 'See how flat-pack panels become a secure steel vault on your land.'},
  sizes: {path: '/sizes', title: 'Sizes, Prices & Finishes | Yard Vault', description: 'Compare seven storage sizes, starting prices, door options, and available finishes.'},
  gallery: {path: '/gallery', title: 'Project Gallery | Yard Vault', description: 'Browse Yard Vault installations, interiors, finishes, and event photographs.'},
  contact: {path: '/contact', title: 'Contact & Quotes | Yard Vault', description: 'Request a quote, book a mobile showroom visit, or explore financing for your Yard Vault.'}
};

export const LEGACY_PATHS = {
  ...Object.fromEntries(Object.entries(PAGES).map(([key, page]) => [key, page.path])),
  start: '/contact'
};

export function pageForPath(pathname) {
  return Object.entries(PAGES).find(([, page]) => page.path === pathname)?.[0];
}
