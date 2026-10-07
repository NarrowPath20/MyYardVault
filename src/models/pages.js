export const PAGES = {
  privacy: {path:'/privacy', title:'Privacy Policy | My Yard Vault 4 Corners', description:'How we handle inquiry information and privacy requests.'},
  terms: {path:'/terms', title:'Terms of Service | My Yard Vault 4 Corners', description:'Website terms, quotes, orders, and product information.'},
  refunds: {path:'/refunds', title:'Cancellation & Refund Policy | My Yard Vault 4 Corners', description:'Request cancellation, returns, or refund terms for your order.'},
  cookies: {path:'/cookies', title:'Cookie Policy | My Yard Vault 4 Corners', description:'Essential browser storage and privacy preferences.'},
  deletion: {path:'/data-deletion', title:'Data Deletion Requests | My Yard Vault 4 Corners', description:'Ask us to review, correct, or delete your inquiry information.'},
  unsubscribe: {path:'/unsubscribe', title:'Communication Preferences | My Yard Vault 4 Corners', description:'Ask us to stop optional follow-up communications.'},
  business: {path:'/business-details', title:'Business Details | My Yard Vault 4 Corners', description:'Contact and service area information.'},
  home: {path: '/', title: 'My Yard Vault 4 Corners, Flat-Pack Steel Storage', description: 'Flat-pack galvanized steel storage, offices, kiosks, and shipping containers for the Four Corners.'},
  storage: {path: '/storage', title: 'Backyard Storage Vaults | My Yard Vault 4 Corners', description: 'Explore flat-pack steel backyard storage, finishes, door configurations, and sizes.'},
  office: {path: '/office', title: 'Office Units | My Yard Vault 4 Corners', description: 'Finished steel office units for job sites, field operations, and growing businesses.'},
  kiosk: {path: '/kiosk', title: 'Retail Kiosks | My Yard Vault 4 Corners', description: 'Explore portable retail kiosks, service windows, and storefront configurations.'},
  multi: {path: '/multi-unit', title: 'Multi-Compartment Units | My Yard Vault 4 Corners', description: 'Separately lockable steel storage bays, configurations, and rental income estimates.'},
  conex: {path: '/shipping-containers', title: 'Shipping Containers | My Yard Vault 4 Corners', description: 'Explore one-trip shipping containers, sizes, specifications, and delivery options.'},
  accessories: {path: '/accessories', title: 'Storage Accessories | My Yard Vault 4 Corners', description: 'Shelving, pipe racks, locking hardware, lighting, and ventilation for your My Yard Vault 4 Corners.'},
  build: {path: '/built-on-site', title: 'Built on Site | My Yard Vault 4 Corners', description: 'See how flat-pack panels become a secure steel vault on your land.'},
  sizes: {path: '/sizes', title: 'Sizes, Prices & Finishes | My Yard Vault 4 Corners', description: 'Compare seven storage sizes, starting prices, door options, and available finishes.'},
  gallery: {path: '/gallery', title: 'Project Gallery | My Yard Vault 4 Corners', description: 'Browse My Yard Vault 4 Corners installations, interiors, finishes, and event photographs.'},
  contact: {path: '/contact', title: 'Contact & Quotes | My Yard Vault 4 Corners', description: 'Request a quote, book a mobile showroom visit, or explore financing for your My Yard Vault 4 Corners.'}
};

export const POLICY_PAGES = ['privacy','terms','refunds','cookies','deletion','unsubscribe','business'];

export const LEGACY_PATHS = {
  ...Object.fromEntries(Object.entries(PAGES).map(([key, page]) => [key, page.path])),
  start: '/contact'
};

export function pageForPath(pathname) {
  return Object.entries(PAGES).find(([, page]) => page.path === pathname)?.[0];
}
