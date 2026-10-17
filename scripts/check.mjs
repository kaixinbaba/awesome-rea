import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadProjects, issueLinks, populatedCategories, kinds } from './catalog.mjs';
import { locales, loadLocale, localePath, displayFields } from './i18n.mjs';
import { loadCovers, isGeneratedCover } from './covers.mjs';
const data = await loadProjects();
const covers = await loadCovers(data);
const origin = new URL(process.env.SITE_URL || 'https://awesomerea.com').origin;
const headers = await readFile('dist/_headers', 'utf8');
// Cloudflare Pages ignores any _headers line longer than 2,000 characters (including the CSP line).
for (const line of headers.split('\n')) assert(line.length <= 2000, `_headers line exceeds Cloudflare Pages 2,000-character limit (${line.length}): ${line.slice(0, 40)}`);
assert(/^  Content-Security-Policy: /m.test(headers), 'Missing enforced CSP');
const esc = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
for (const locale of Object.keys(locales)) {
 const { lang, projects, og, t } = await loadLocale(locale, data);
 for (const page of ['', 'method/', '404.html']) {
  const pagePath = localePath(locale, page);
  const file = `dist${pagePath}${pagePath.endsWith('/') ? 'index.html' : ''}`;
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${file}: one h1`);
  assert(html.includes(`<html lang="${lang}">`));
  assert(html.includes('name="description"'));
  assert(html.includes(`rel="canonical" href="${origin}${pagePath}"`));
  assert(html.includes(`property="og:url" content="${origin}${pagePath}"`));
  assert(html.includes(`property="og:image" content="${origin}/${og}"`));
  for (const [code, l] of Object.entries(locales)) {
   assert(html.includes(`rel="alternate" hreflang="${l.lang}" href="${origin}${localePath(code, page)}"`));
   assert(html.includes(`data-language="${code}" lang="${l.lang}" hreflang="${l.lang}" href="${localePath(code, page)}"`));
  }
  assert(html.includes(`hreflang="x-default" href="${origin}${localePath('en', page)}"`));
  assert(!/https:\/\/(?:claude\.ai|(?:[^/]+\.)?anthropic\.com)/i.test(html));
  for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"#?]*)/g)) {
   const local = decodeURIComponent(match[1]);
   const target = 'dist' + local + (local.endsWith('/') ? 'index.html' : '');
   assert((await stat(target)).isFile(), `Missing internal asset: ${target}`);
  }
  // Content-derived URLs protect returning visitors with still-fresh old assets.
  for (const name of ['styles.css', 'locale.js', 'analytics.js', ...(page === '' ? ['app.js'] : [])]) {
   const hash = createHash('sha256').update(await readFile(`dist/${name}`)).digest('hex').slice(0, 12);
   assert(html.includes(`"/${name}?v=${hash}"`), `${file}: stale-cache-safe ${name} reference required`);
   assert(!html.includes(`"/${name}"`), `${file}: unversioned ${name} reference`);
  }
  assert.equal(html.includes('content="noindex"'), page === '404.html');
  if (page === '') {
   assert.equal((html.match(/class="project-card"/g) || []).length, projects.length);
   assert.equal((html.match(/class="cover-image"/g) || []).length, Object.keys(covers).length);
   assert.equal((html.match(/class="cover-fallback"/g) || []).length, projects.length);
   for (const p of projects) {
    if (covers[p.id]) {
     const c = covers[p.id];
     const alt = isGeneratedCover(c) ? t('card.coverAltGenerated', { name: p.name }) : t('card.coverAlt', { name: p.name });
     assert(html.includes(`src="${c.src}" width="${c.width}" height="${c.height}" alt="${esc(alt)}" loading="lazy" decoding="async"`));
     if (isGeneratedCover(c)) assert(html.includes(esc(t('card.coverGenerated'))), `${p.id}: generated credit missing`);
     else assert(html.includes(`href="${c.readme}"`), `${p.id}: image source credit missing`);
     assert(html.includes(`href="${localePath(locale, `projects/${p.id}/`)}"`), `${p.id}: detail permalink missing`);
    }
    assert(html.includes(`id="${p.id}" class="project-card" data-category="${p.category}" data-kind="${p.kind}"`));
    assert(html.includes(p.evidence), `${p.id}: primary evidence missing`);
    for (const key of displayFields.filter(k => k !== 'listSummary' && Object.hasOwn(p, k))) assert(html.includes(esc(p[key])), `${locale}/${p.id}: missing ${key}`);
   }
   for (const [key] of populatedCategories(projects)) assert(html.includes(`data-filter="${key}"`));
   for (const key of Object.keys(kinds).filter(k => projects.some(p => p.kind === k))) assert(html.includes(`<option value="${key}">`));
   const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
   const structured = JSON.parse(json);
   assert.equal(structured.inLanguage, lang);
   assert.equal(structured.numberOfItems, projects.length);
   assert.equal(structured.itemListElement.length, projects.length);
   assert.deepEqual(structured.itemListElement.map(item => item.url), projects.map(p => `${origin}${localePath(locale, `projects/${p.id}/`)}`));
   assert(html.includes(esc(t('hero.optional'))));
  }
  if (page === 'method/') {
   for (const url of Object.values(issueLinks)) assert(html.includes(url));
   assert(html.includes(esc(t('method.lead'))));
  }
  assert(!html.includes('mailto:'));
 }
 assert((await stat(`dist/${og}`)).size > 0);
}
for (const url of Object.values(issueLinks)) {
 const file = new URL(url).searchParams.get('template');
 const form = await readFile(`.github/ISSUE_TEMPLATE/${file}`, 'utf8');
 assert(form.includes('body:') && form.includes('required: true') && form.includes('中文'));
}
const suggestionForm = await readFile('.github/ISSUE_TEMPLATE/1-project.yml', 'utf8');
assert(suggestionForm.includes('Independent reimplementation') && suggestionForm.includes('Compatibility project'));
assert(!suggestionForm.includes('with a verifiable REA connection'));
for (const locale of Object.keys(locales)) {
 const { projects, t } = await loadLocale(locale, data);
 for (const p of projects) {
  const page = `projects/${p.id}/`;
  const file = `dist${localePath(locale, page)}index.html`;
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${file}: one h1`);
  assert(html.includes(`rel="canonical" href="${origin}${localePath(locale, page)}"`));
  assert(html.includes(esc(p.summary)));
  assert(html.includes(esc(p.evidenceScope)));
  assert(html.includes(esc(p.limitation)));
  assert(html.includes(p.evidence));
  if (covers[p.id]) assert(html.includes(`src="${covers[p.id].src}"`));
 }
 for (const [key] of populatedCategories(projects)) {
  const page = `categories/${key}/`;
  const file = `dist${localePath(locale, page)}index.html`;
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${file}: one h1`);
  assert(html.includes(`rel="canonical" href="${origin}${localePath(locale, page)}"`));
  assert.equal((html.match(/class="project-card"/g) || []).length, projects.filter(p => p.category === key).length);
 }
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert(!sitemap.includes('404'));
const expectedLocs = Object.keys(locales).flatMap(locale => {
 const pages = ['', 'method/', ...populatedCategories(data).map(([key]) => `categories/${key}/`), ...data.map(p => `projects/${p.id}/`)];
 return pages.map(page => `${origin}${localePath(locale, page)}`);
});
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), expectedLocs);
assert.equal((sitemap.match(/hreflang="/g) || []).length, expectedLocs.length * 3);
assert((await readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${origin}/sitemap.xml`));
console.log(`PASS: ${data.length} entries in both locales, detail+category pages, local assets, translation coverage, hreflang, JSON-LD/CSP and sitemap (${expectedLocs.length} locs)`);
