# My Yard Vault 4 Corners website

The supplied `index (81).html` has been separated into a lightweight JavaScript MVC application. It uses Node.js built-in modules, with no npm dependencies or build step.

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

The server page controller renders `layout.html` with only the requested page. Each page shares the header, nested navigation, chat, and footer. Product pages cannot be reached by scrolling through another page: links trigger ordinary browser navigation, support opening new tabs, and work without JavaScript. Browser controllers import data from models and load page-specific interactions only where needed. Use the server to run the site; template includes and modules require HTTP rather than opening HTML files directly.

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
