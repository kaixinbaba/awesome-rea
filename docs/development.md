# Development and deployment

**English** · [简体中文](development.zh-CN.md)

**One JSON catalog with reviewed translations generates both README directories and a static bilingual website. Scope: open-source reverse engineering, independent reimplementations and compatibility projects; REA usage is optional. No backend is needed.**

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
| `src/projects.json` | Canonical English catalog; shared IDs, URLs, taxonomy and source-review dates |
| `src/locales/en.json`, `src/locales/zh-CN.json` | Complete UI, metadata, accessibility, dynamic-message and taxonomy translations |
| `src/locales/projects.zh-CN.json` | Chinese project display fields, keyed by the same IDs; no separate URLs or classifications |
| `scripts/i18n.mjs` | Locale registry, strict coverage / placeholder checks and translation freshness hashes |
| `scripts/catalog.mjs` | Taxonomy and data validation |
| `scripts/readme.mjs` | Generate/check both README catalog blocks |
| `scripts/build.mjs` | Generate HTML, sitemap, robots and security headers |
| `public/` | First-party CSS, JavaScript, favicon and social image |
| `.github/ISSUE_TEMPLATE/` | Suggestion, correction/removal and website-bug forms |
| `.github/workflows/check.yml` | Read-only checks for PRs; tested `main` artifacts automatically deploy to Pages |
| `scripts/deployment-check.mjs` | Verify the production commit, public bytes, security headers, localized 404s and redirect |

## Catalog fields

| Field | Meaning |
| --- | --- |
| `id` | Unique stable lowercase URL anchor; do not rename existing IDs casually |
| `name`, `url` | Display name and current canonical project/page URL |
| `category` | Purpose: `dev-tools`, `games`, `apps`, `hardware`, `integrations`, or `learning` |
| `kind` | Type: `tool`, `reconstruction`, `interoperability`, `integration`, `analysis`, or `resource` |
| `relationship` | Project provenance label from `scripts/catalog.mjs`; independent reimplementations and compatibility projects need no REA connection. Use a REA-specific label only when supported. |
| `summary`, `target` | Website description and target/platform context |
| `listSummary` | Optional one-sentence README description, at most 160 characters; falls back to `summary`. Preserve the actual scope and maturity. |
| `evidence`, `evidenceScope` | Primary HTTPS source and the exact scope it supports; prefer a full commit-pinned URL |
| `status`, `limitation` | Author-reported maturity and important missing features, dependencies or evidence limits |
| `license`, `licenseUrl` | Scoped license label and primary license notice; `null` is allowed for a reading-only case study/resource, not unlicensed software |
| `licenseNote` | Optional detail about separate asset or third-party terms |
| `secondary`, `secondaryLabel` | Optional supporting source and link label |
| `checked` | Actual source-review date in `YYYY-MM-DD`; never set to a future date |
| `initial`, `tag`, `tone` | Small display mark, specific subtitle and one of `mint`, `peach`, `lavender`, `sand` |

Purpose, output type, project relationship and maturity are independent. REA usage is not an inclusion requirement; early/alpha projects may be listed with accurate limitations. Empty purpose groups are hidden. Search covers visible card text and evidence details; purpose and type filters combine. Entries remain readable without JavaScript.

Run `npm run readme` after data or translation changes. `npm test` fails if either README is stale. Only the catalog blocks between marker comments are generated; surrounding prose can be edited normally.

## Internationalization

English keeps `/` and `/method/`; Simplified Chinese uses `/zh/` and `/zh/method/`. Each has a localized 404 page, social image, self-canonical URL, reciprocal `hreflang` and locale-specific structured data. The sitemap lists four indexable pages; 404 pages remain `noindex`. No server, runtime translation service or language negotiation is needed. Plain links switch the corresponding page even without JavaScript; with JavaScript they also preserve query strings and anchors. Filters reset on navigation. Language navigation uses no cookies, saved language preference or automatic redirects. Optional analytics consent is separate; see [Analytics](ANALYTICS.md).

Every UI key and project display field is required in both languages; there is no silent English fallback. Brands, technical identifiers, commands and SPDX identifiers retain their original spelling. Translations never change project IDs, URLs, taxonomy or review dates. Changing an English source record invalidates its translation hash: review the Chinese wording first, then calculate `sourceHash(project)` exported by `scripts/i18n.mjs` and set that entry's `sourceHash`. This detects stale translations but does not certify their factual accuracy. Example for one reviewed entry:

```sh
node --input-type=module -e "import {loadProjects} from './scripts/catalog.mjs'; import {sourceHash} from './scripts/i18n.mjs'; console.log(sourceHash((await loadProjects()).find(p => p.id === 'photocraft')))"
```

To add a language, register its paths and metadata in `scripts/i18n.mjs`, provide complete UI/project translations plus its README, and extend validation/browser coverage. Regenerate social images with `node scripts/social-image.mjs` after changing their messages; these are local HTML screenshots, not model-generated images. Production verified on 2026-10-12: Cloudflare Pages serves the nearest `404.html` for unknown paths, including nested Chinese paths under `/zh/`, with a real 404 status and the matching language. Recheck this after deployment rather than adding a wildcard 200 rewrite.

## Browser checks

```sh
npx playwright install chromium webkit
npm run dev
# In another terminal:
npm run test:browser
# Against the deployed site:
TEST_URL=https://awesomerea.com TEST_OUTPUT=test-results/production npm run test:browser
```

The suite checks both languages in Chromium/WebKit, 320–1440px layouts, each purpose/type combination, Chinese search, reset, entry-anchor recovery, reciprocal language navigation, Issue links, clipboard paths, no-JavaScript rendering, localized 404s and automated accessibility. It seeds declined analytics consent so these regressions never send Google traffic. Run `npm run test:analytics` for the separate mock-only consent, withdrawal, privacy-signal, storage and preview-isolation tests. This is not physical-device or full accessibility certification. Reports and screenshots remain local under ignored `test-results/`.

## Deployment

**Push `main` to release.** GitHub Actions validates/builds the commit, runs mock-only analytics and local browser checks, transfers the tested `dist/` artifact to the release job, then automatically publishes to the existing Cloudflare Pages project `awesomerea`. Pull requests run checks only, without publishing credentials. Production releases are serialized so an older run cannot overwrite a newer one.

After committing the reviewed changes:

```sh
git push origin main
```

Wait for the [Check and deploy website workflow](https://github.com/kaixinbaba/awesome-rea/actions/workflows/check.yml) to succeed. The final step verifies the Cloudflare production commit matches the workflow SHA, all public files match the tested artifact, and security headers, bilingual 404s and the old-host 301 remain correct. A push or upload alone is not release acceptance. Revert through a reviewed `main` commit to roll back.

Repository configuration: Actions secret `CLOUDFLARE_API_TOKEN` (dedicated account-scoped Pages Edit credential) and variable `CLOUDFLARE_ACCOUNT_ID`. Never store credential values in Git, documentation, local reports or chat. The initial dedicated token expires on 2027-10-13; renew in Cloudflare and replace the Actions secret before expiry. Validation jobs never receive the token.

The Pages project retains Direct Upload mode because Cloudflare cannot convert that existing project to native Git integration. GitHub Actions supplies the Git-triggered release; no new Pages project or domain migration is needed. Wrangler 4.135.0 is an internal CI step, **not the normal local release command**. Publish only `dist/`, never the repository, private notes, environment files or test artifacts. Do not add a `--force` flag.

The production domain and default site origin are `https://awesomerea.com`. Its apex CNAME points to `awesomerea.pages.dev`; Cloudflare Pages owns the custom-domain binding and HTTPS certificate. Set `SITE_URL=https://your-domain.example` before building to override canonical, Open Graph and sitemap origins. A build setting alone does not bind a domain. Verify deployed files, response headers, real page behavior and any hostname redirects after publishing.

The old `awesomerea.pages.dev` hostname redirects permanently (301) to `https://awesomerea.com`, preserving paths and query strings while excluding preview subdomains. This is an account-level Cloudflare Bulk Redirect: list `awesome_rea_primary_domain`, rule `Awesome REA primary domain`. It is configured in Cloudflare, not the deployment files; preserve it when moving accounts. Do not replace it with a catch-all Pages `_redirects` rule, which would also affect the custom domain.

Cloudflare Real User Measurements (RUM) is explicitly disabled for `awesomerea.com` to prevent its default analytics-beacon injection. Recheck this setting when attaching a new domain; the browser suite rejects unexpected third-party requests.

Search queries and language preferences are not stored or transmitted. Optional GA4 loads only after explicit consent on `https://awesomerea.com`; declined/default visits, privacy signals, local and preview origins send no analytics. Consent is stored for up to 180 days, and footer settings allow withdrawal. CSP permits only the required Google tag and collection origins in addition to existing first-party assets. GSC domain verification and sitemap submission are separate from browser analytics. See [Analytics](ANALYTICS.md) for resource IDs, privacy rules and actual verification status. Cloudflare still processes delivery/security request metadata; Google, GitHub Issues and external links are governed by their destination services.
