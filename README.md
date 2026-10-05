# My Yard Vault 4 Corners website

The supplied `index (81).html` has been separated into a lightweight JavaScript MVC application. It uses Node.js built-in modules, with no npm dependencies. Run the Node server locally or build static pages for GitHub Pages.

## Deploy to GitHub Pages

1. Push this repository to GitHub using the `master` or `main` branch.
2. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages** and run the workflow, or push another commit. The workflow tests, builds, and deploys the site. Its deployment link shows the published URL.

The workflow in `.github/workflows/pages.yml` uses the configured Pages base path, so navigation, images, and JavaScript work at repository URLs such as `https://USERNAME.github.io/MyYardVault/`, user sites, and custom domains. Each page has its own directory and `index.html`, supporting direct links and refreshes. If you use a different branch, update the workflow's branch list.

To build manually with Node.js 22.9 or newer:

```sh
npm run build
```

This creates the static site in `dist/` with root-relative URLs. For a repository URL, set the base path before building (PowerShell):

```powershell
$env:PAGES_BASE_PATH = '/MyYardVault/'
npm.cmd run build
```

Serve `dist/` over HTTP to preview it; when using a repository base path, mount that folder at the same URL prefix. Generated output is ignored by Git. Only public assets and browser modules are published; server code, credentials, and saved leads are excluded.

GitHub Pages cannot run the Node lead API or Twilio notifications. Forms and chat lead capture show a message directing visitors to phone or email when submitting on the static site. Product navigation, galleries, estimates, and local chat answers still work. Use the Node server when online lead submissions are required.

## Run locally

Install Node.js 22.9 or newer, then run from this folder:

```sh
npm start
```

Open http://localhost:3000. To change the port in PowerShell:

```powershell
$env:PORT = 8080
npm start
```

Run verification with `npm test`.

If PowerShell blocks npm scripts on Windows, use `npm.cmd start` and `npm.cmd test`.

An additional browser smoke check is available with `node tools/browser-smoke.js`. It uses Chrome on Windows by default; set `CHROME_PATH` to use another Chrome/Chromium executable. It verifies page navigation, product selection, payment estimates, chat responses, galleries, and direct mobile navigation.

Run `node tools/browser-smoke.js --responsive` to check every page at nine viewport sizes, from 280-pixel-wide phones to ultrawide monitors, including short landscape screens. It checks content bounds, closed-menu visibility, and reachable menu actions, and saves desktop/mobile screenshots in `out/responsive/`.

Responsive layout rules are in `public/assets/css/responsive.css`, loaded after the original stylesheet. Cards use flexible minimum widths, narrow-screen forms and footers stack, hero controls stay in normal flow, and navigation scrolls independently when open. Hidden navigation is inert and excluded from keyboard navigation.

The header uses the same hamburger menu on every screen. Its markup lives in `src/views/partials/navigation.html`; Products and Solutions expand independently on click or keyboard activation. Choosing a link closes the menu, Escape closes it and returns focus, and clicking outside closes it. On desktop it is a compact dropdown; on phones it fills the space below the header and scrolls when necessary.

## Where to edit

| Layer | Location | Responsibility |
| --- | --- | --- |
| Models | `src/models/` | Product sizes, prices, finishes, office use cases, construction steps, chat knowledge |
| Views | `src/views/pages/` | Eleven independent page templates |
| Shared views | `src/views/partials/` | Header, footer, chat widget |
| Layout | `src/views/layout.html` | Document metadata, shared background assets, page composition |
| Visual renderers | `src/views/renderers/` | Three.js scene, visual effects, toast notifications |
| Controllers | `src/controllers/` | Navigation, forms, selectors, galleries, menus, estimators, chat interactions |
| Styles | `public/assets/css/site.css` | Original responsive styles, kept in their original order |
| Images | `public/assets/images/` | 131 unique images extracted from inline base64 data, without recompression |
| Startup | `public/app.js` | Initializes shared controls and loads controllers for the current page |
| Server | `server.js` | Serves the assembled view, browser modules, and public assets |

The server page controller renders `layout.html` with only the requested page. Each page shares the header, nested navigation, chat, and footer. Product pages cannot be reached by scrolling through another page: links trigger ordinary browser navigation, support opening new tabs, and work without JavaScript. Browser controllers import data from models and load page-specific interactions only where needed. Use the Node server or the static build to run the site over HTTP rather than opening HTML files directly.

| URL | Page |
| --- | --- |
| `/` | Home and product summaries |
| `/storage` | Backyard storage |
| `/office` | Office units |
| `/kiosk` | Retail kiosks |
| `/multi-unit` | Multi-compartment storage |
| `/shipping-containers` | Shipping containers |
| `/accessories` | Accessories |
| `/built-on-site` | Construction walkthrough |
| `/sizes` | Sizes, prices, and finishes |
| `/gallery` | Photo gallery |
| `/contact` | Showroom visits, quotes, and financing |

Page URLs and metadata live in `src/models/pages.js`. Old bookmarks such as `/#storage` redirect to the new URL. Quote links use `/contact?panel=quote`; financing links use `/contact?panel=financing`. Homepage coverage and FAQ remain informational sections of the homepage. Product-page anchors such as `/storage#st-sizes` stay within their own page.

Forms and chat lead capture submit to a shared backend API. Leads are saved privately before any Twilio notification; live SMS is disabled by default and requires explicit account configuration. See [Twilio setup and lead workflow](docs/TWILIO_SETUP.md) for local testing, account activation, delivery callbacks, and reviewing saved requests. The current store uses local files; the adapter can be replaced with the client's database or CRM for deployment.

The source file in Downloads is untouched. Fonts and Three.js still use the original external providers. Chat answers use the local knowledge base. Existing placeholder content and agent-portal behavior remain as supplied.
