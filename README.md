# My Yard Vault 4 Corners website

Open the website at **[https://narrowpath20.github.io/MyYardVault/](https://narrowpath20.github.io/MyYardVault/)**.

The supplied `index (81).html` has been separated into a lightweight JavaScript MVC application. GitHub Pages serves the complete static website, including the homepage, product pages, images, navigation, galleries, and browser interactions.

## Deploy to GitHub Pages

1. Push this repository to GitHub using the `master` or `main` branch.
2. Open [Settings → Pages](https://github.com/NarrowPath20/MyYardVault/settings/pages). Under **Build and deployment**, set **Source** to **GitHub Actions**. This repository requires that setting; deploying from a branch renders the README instead of building the application.
3. Open **Actions → Deploy GitHub Pages** and run the workflow, or push another commit. The workflow tests, builds, and deploys the website.
4. Once deployment succeeds, visit [the published website](https://narrowpath20.github.io/MyYardVault/).

The workflow in `.github/workflows/pages.yml` builds the application into `dist/` and uploads that folder. The homepage is rendered from `src/views/pages/home.html` with the shared layout, header, and footer. The README stays repository documentation.

### If Pages still displays the README

The **pages build and deployment** workflow is GitHub's automatic branch/Jekyll deployment. When it runs alongside **Deploy GitHub Pages**, it can overwrite the built website with the README even though both runs succeed. Changing the Pages **Source** to **GitHub Actions** disables that competing branch deployment. Then open [Deploy GitHub Pages](https://github.com/NarrowPath20/MyYardVault/actions/workflows/pages.yml), choose **Run workflow** on `master`, and wait for it to finish before refreshing the website. The website workflow checks the Pages source and reports this configuration error before deploying.

The build uses the configured Pages base path (`/MyYardVault/` for this repository), so links, images, styles, and JavaScript resolve under the published URL. Each page has its own directory and `index.html`, supporting direct links and refreshes. Only public assets and browser modules are published; server code, credentials, and saved leads are excluded.

GitHub Pages cannot run the Node lead API or Twilio notifications. Forms and chat lead capture direct visitors to phone or email when submitting on the static site. Product navigation, galleries, payment estimates, and local knowledge-base chat answers work in the browser. Online lead storage and SMS require a separately hosted backend.

## Build verification

The GitHub Actions workflow uses Node.js 22 and runs these checks automatically before deployment:

```sh
npm test
npm run build
```

To generate the same static output manually with Node.js 22.9 or newer in PowerShell:

```powershell
$env:PAGES_BASE_PATH = '/MyYardVault/'
npm.cmd run build
```

Generated output in `dist/` is ignored by Git. The Pages workflow builds it again from the committed source.

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

The static build renders `layout.html` with each page template. Each page shares the header, nested navigation, chat, and footer. Product pages cannot be reached by scrolling through another page: links trigger ordinary browser navigation, support opening new tabs, and work without JavaScript. Browser controllers import data from models and load page-specific interactions only where needed. View the application through the published GitHub Pages URL; the source templates are not standalone HTML documents.

The routes below are relative to `https://narrowpath20.github.io/MyYardVault/`. For example, the storage page is [https://narrowpath20.github.io/MyYardVault/storage/](https://narrowpath20.github.io/MyYardVault/storage/).

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

The repository also includes a Node backend for future hosting beyond GitHub Pages. When that backend is hosted, forms and chat lead capture submit to its shared API, which saves leads privately before any Twilio notification. Live SMS is disabled by default and requires explicit account configuration. See [Twilio setup and lead workflow](https://github.com/NarrowPath20/MyYardVault/blob/HEAD/docs/TWILIO_SETUP.md) for backend configuration, account activation, delivery callbacks, and reviewing saved requests. The current backend store uses local files; the adapter can be replaced with the client's database or CRM.

Fonts and Three.js are served locally with upstream licenses under `public/assets/licenses/`; no Google Fonts or CDN request is required at runtime. Chat answers use the local knowledge base and do not send conversations to an AI provider.

## Privacy and trust controls

The footer links to privacy, website terms, refund information, cookies, business details, communication preferences, and data-deletion instructions. All inquiry forms and chat contact requests require unchecked adult and response-permission confirmations; the API checks both and records the current notice version. Inquiry storage prunes records older than 180 days at startup and daily while the server runs.

Use `node tools/leads.js delete <reference> --identity-verified` only after verifying a deletion request through the contact method already on file. Provider, email, CRM, and backup copies need separate handling. This website has no automated customer email service or marketing list; the manual email footer is in `docs/EMAIL_FOOTER.txt`.

Set `BUSINESS_LEGAL_NAME` and `BUSINESS_POSTAL_ADDRESS` to verified seller details in `.env`. Actual refund/deposit terms, manufacturer claim evidence, and image permission records still need business-owner confirmation. See [the 20-item audit](docs/SITE_AUDIT.md) and [image rights inventory](docs/IMAGE_RIGHTS.csv).

Run `node tools/browser-smoke.js --accessibility --responsive` for both-theme axe-core WCAG A/AA checks and all-page viewport checks. Accessibility results, including items requiring manual contrast review, are saved in `out/audit/accessibility.json`. Axe is a development tool and is never loaded by the website.
