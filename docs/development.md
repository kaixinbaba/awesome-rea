# Development and deployment

**One JSON catalog generates the README directory and a static website. No server, database, runtime dependency or submission service is needed.**

## Local development

Use Node.js 22 or later.

```sh
npm ci
npm run readme
npm test
npm run dev
```

Preview at `http://127.0.0.1:4387`. Build output is in `dist/`; it is not committed. `npm test` checks data contracts, generated README parity, HTML/assets and SEO metadata. No linked third-party software is installed or executed.

| Path | Purpose |
| --- | --- |
| `src/projects.json` | The only catalog data source |
| `scripts/catalog.mjs` | Taxonomy and data validation |
| `scripts/readme.mjs` | Generate/check only the README catalog block |
| `scripts/build.mjs` | Generate HTML, sitemap, robots and security headers |
| `public/` | First-party CSS, JavaScript, favicon and social image |
| `.github/ISSUE_TEMPLATE/` | Suggestion, correction/removal and website-bug forms |
| `.github/workflows/check.yml` | Read-only validation; no deployment credentials |

## Catalog fields

| Field | Meaning |
| --- | --- |
| `id` | Unique stable lowercase URL anchor; do not rename existing IDs casually |
| `name`, `url` | Display name and current canonical project/page URL |
| `category` | Purpose: `dev-tools`, `games`, `apps`, `hardware`, `integrations`, or `learning` |
| `kind` | Type: `tool`, `reconstruction`, `interoperability`, `integration`, `analysis`, or `resource` |
| `relationship` | One of the six human-readable values in `scripts/catalog.mjs` |
| `summary`, `target` | Website description and target/platform context |
| `listSummary` | Optional one-sentence README description, at most 160 characters; falls back to `summary`. Keep the REA scope accurate. |
| `evidence`, `evidenceScope` | Primary HTTPS source and the exact scope it supports; prefer a full commit-pinned URL |
| `status`, `limitation` | Author-reported maturity and important missing features, dependencies or evidence limits |
| `license`, `licenseUrl` | Scoped license label and primary license notice; `null` is allowed for a reading-only case study/resource, not unlicensed software |
| `licenseNote` | Optional detail about separate asset or third-party terms |
| `secondary`, `secondaryLabel` | Optional supporting source and link label |
| `checked` | Actual source-review date in `YYYY-MM-DD`; never set to a future date |
| `initial`, `tag`, `tone` | Small display mark, specific subtitle and one of `mint`, `peach`, `lavender`, `sand` |

Purpose, output type, REA relationship and maturity are independent. Empty purpose groups are hidden. Search covers visible card text and evidence details; purpose and type filters combine. Entries remain readable without JavaScript.

Run `npm run readme` after data changes. `npm test` fails if the committed README no longer matches the JSON. Only the catalog block between its marker comments is generated; the surrounding README can be edited normally.

## Browser checks

```sh
npx playwright install chromium webkit
npm run dev
# In another terminal:
npm run test:browser
# Against the deployed site:
TEST_URL=https://awesomerea.com TEST_OUTPUT=test-results/production npm run test:browser
```

The suite checks Chromium/WebKit, 320–1440px layouts, each purpose/type combination, search/reset, entry-anchor recovery, Issue links, clipboard paths, no-JavaScript rendering, 404 and automated accessibility. This is not physical-device or full accessibility certification. Reports and screenshots remain local under ignored `test-results/`.

## Deployment

Cloudflare Pages project: `awesomerea`. Deployment is **manual**, not Git-integrated. CI validates changes but has no publishing secrets. A merged README and the deployed website can briefly differ until the maintainer publishes the same reviewed commit.

```sh
npm test
npx wrangler@4.135.0 pages deploy dist --project-name awesomerea --branch main
```

Authenticate with an account allowed to deploy to that project. Upload **only `dist/`**, never the repository, private notes, environment files or test artifacts. Do not add a `--force` flag.

The production domain and default site origin are `https://awesomerea.com`. Its apex CNAME points to `awesomerea.pages.dev`; Cloudflare Pages owns the custom-domain binding and HTTPS certificate. Set `SITE_URL=https://your-domain.example` before building to override canonical, Open Graph and sitemap origins. A build setting alone does not bind a domain. Verify deployed files, response headers, real page behavior and any hostname redirects after publishing.

The old `awesomerea.pages.dev` hostname redirects permanently (301) to `https://awesomerea.com`, preserving paths and query strings while excluding preview subdomains. This is an account-level Cloudflare Bulk Redirect: list `awesome_rea_primary_domain`, rule `Awesome REA primary domain`. It is configured in Cloudflare, not the deployment files; preserve it when moving accounts. Do not replace it with a catch-all Pages `_redirects` rule, which would also affect the custom domain.

Cloudflare Real User Measurements (RUM) is explicitly disabled for `awesomerea.com` to prevent its default analytics-beacon injection. Recheck this setting when attaching a new domain; the browser suite rejects unexpected third-party requests.

The static application sets no cookies, stores no queries and makes no analytics requests. Cloudflare still processes delivery/security request metadata; GitHub Issues and external links are governed by their destination services.
