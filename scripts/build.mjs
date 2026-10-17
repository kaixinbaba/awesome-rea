import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadProjects, kinds, relationships, populatedCategories, repository, issueLinks } from './catalog.mjs';
import { locales, loadLocale, localePath } from './i18n.mjs';
import { loadCovers, isGeneratedCover } from './covers.mjs';

const site = new URL(process.env.SITE_URL || 'https://awesomerea.com');
if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash || site.username || site.password) throw new Error('SITE_URL must be an HTTPS origin');
const origin = site.origin;
const source = await loadProjects();
const covers = await loadCovers(source);
const blurbs = JSON.parse(await readFile('src/project-detail-blurbs.json', 'utf8'));
const assetVersions = Object.fromEntries(await Promise.all(['styles.css', 'locale.js', 'analytics.js', 'app.js'].map(async name => [name, createHash('sha256').update(await readFile(`public/${name}`)).digest('hex').slice(0, 12)])));
const assetUrl = name => `/${name}?v=${assetVersions[name]}`;
const checked = source.map(p => p.checked).sort().at(-1);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ext = (url, label, cls = '') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span aria-hidden="true"> ↗</span></a>`;
const icon = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M11 7 3 16l8 9M21 7l8 9-8 9M19 5l-6 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const claritySnippet = `(function(){if(location.origin!=="https://awesomerea.com")return;(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "yy4tlvmg63");})();`;
const umamiSnippet = `(function(){if(location.origin!=="https://awesomerea.com")return;var s=document.createElement("script");s.defer=true;s.src="https://analytics.murdoku.fans/script.js";s.setAttribute("data-website-id","47d78379-0c7b-4149-b17e-9535a292bdb8");document.head.appendChild(s);})();`;
// Only executable inline scripts need CSP hashes; JSON-LD data blocks are not executed and are not subject to script-src.
// Keep the CSP line under Cloudflare Pages' 2,000-character _headers limit, or Pages silently drops it.
const hashes = [claritySnippet, umamiSnippet].map(snippet => createHash('sha256').update(snippet).digest('base64'));
const projectPage = id => `projects/${id}/`;
const categoryPage = key => `categories/${key}/`;
await rm('dist' , { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });

const sitemapPages = [];

for (const locale of Object.keys(locales)) {
  const { t, projects, lang, og, ogLocale } = await loadLocale(locale, source);
  const s = (key, values) => esc(t(key, values));
  const groups = populatedCategories(projects);
  const home = localePath(locale);
  const methodPath = localePath(locale, 'method/');
  const detailHref = id => localePath(locale, projectPage(id));
  const categoryHref = key => localePath(locale, categoryPage(key));
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: t('seo.catalogName'), inLanguage: lang, numberOfItems: projects.length, itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: `${origin}${detailHref(p.id)}` })) }).replaceAll('<', '\\u003c');

  function head(page, { title, description, noindex = false, includeApp = false, extraJsonLd = '' } = {}) {
    const path = localePath(locale, page);
    const alternates = Object.entries(locales).map(([code, l]) => `<link rel="alternate" hreflang="${l.lang}" href="${origin}${localePath(code, page)}">`).join('');
    const titleText = esc(title);
    const descText = esc(description);
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titleText}</title><meta name="description" content="${descText}"><meta name="theme-color" content="#f6f7f4">${noindex ? '<meta name="robots" content="noindex">' : ''}<link rel="canonical" href="${origin}${path}">${alternates}<link rel="alternate" hreflang="x-default" href="${origin}${localePath('en', page)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Awesome REA"><meta property="og:title" content="${titleText}"><meta property="og:description" content="${descText}"><meta property="og:url" content="${origin}${path}"><meta property="og:locale" content="${ogLocale}">${Object.values(locales).filter(l => l.lang !== lang).map(l => `<meta property="og:locale:alternate" content="${l.ogLocale}">`).join('')}<meta property="og:image" content="${origin}/${og}"><meta property="og:image:alt" content="${s('seo.homeDescription')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${assetUrl('styles.css')}"><script src="${assetUrl('locale.js')}" defer></script><script src="${assetUrl('analytics.js')}" defer></script><script type="text/javascript">${claritySnippet}</script><script type="text/javascript">${umamiSnippet}</script>${includeApp ? `<script type="application/ld+json">${jsonLd}</script><script src="${assetUrl('app.js')}" defer></script>` : ''}${extraJsonLd}</head><body><a class="skip" href="#main">${s('nav.skip')}</a>`;
  }
  function nav(page) {
    return `<header class="header wrap"><a class="brand" href="${home}" aria-label="${s('nav.home')}">${icon}<span>awesome<span class="brand-light">rea</span><span class="brand-dot">.</span></span></a><nav aria-label="${s('nav.label')}"><a href="${home}#directory">${s('nav.directory')}</a><a href="${home}#get-started">${s('nav.start')}</a><a href="${methodPath}">${s('nav.method')}</a>${ext(repository, t('nav.contribute'), 'nav-github')}<div class="language-switch" role="group" aria-label="${s('nav.language')}">${Object.entries(locales).map(([code, l]) => `<a data-language="${code}" lang="${l.lang}" hreflang="${l.lang}" href="${localePath(code, page)}"${code === locale ? ' aria-current="page"' : ''}>${esc(l.label)}</a>`).join('<span aria-hidden="true"> / </span>')}</div></nav></header>`;
  }
  const consent = `<section id="analytics-consent" class="analytics-consent wrap" aria-labelledby="analytics-consent-title" hidden><div><strong id="analytics-consent-title">${s('analytics.title')}</strong><p>${s('analytics.text')} <a href="${methodPath}#privacy">${s('analytics.privacy')}</a></p><p id="analytics-status" role="status" data-signal="${s('analytics.signal')}" data-preview="${s('analytics.preview')}"></p></div><div class="analytics-actions"><button type="button" id="analytics-reject">${s('analytics.reject')}</button><button type="button" id="analytics-accept">${s('analytics.accept')}</button></div></section>`;
  const footer = consent + `<footer class="footer wrap"><div><a class="brand" href="${home}">${icon}<span>awesomerea<span class="brand-dot">.</span></span></a><p>${s('footer.independent')}</p><a class="fazier-badge" href="https://fazier.com/launches/awesomerea.com" target="_blank" rel="noopener noreferrer"><img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" width="120" alt="Fazier badge" /></a></div><div class="footer-links"><a href="${methodPath}">${s('footer.method')}</a><a href="${issueLinks.suggest}">${s('footer.suggest')} ↗</a><a href="${issueLinks.correction}">${s('footer.correct')} ↗</a>${ext(repository, t('footer.github'))}${ext('https://github.com/kaixinbaba', t('footer.curator'))}<a href="https://realisticai.io">Realistic AI</a><span>${s('common.review')}: ${checked}</span><button type="button" id="analytics-settings" data-allowed="${s('analytics.allowed')}" data-off="${s('analytics.off')}" hidden>${s('analytics.settings')}</button></div></footer></body></html>`;
  function cover(p, { detail = false } = {}) {
    const image = covers[p.id];
    const generated = image && isGeneratedCover(image);
    const fallback = `<div class="cover-fallback" aria-hidden="true"><span class="cover-mark">${esc(p.initial)}</span><span class="cover-symbol">${icon}</span></div>`;
    const alt = generated ? s('card.coverAltGenerated', { name: p.name }) : s('card.coverAlt', { name: p.name });
    const credit = !image ? '' : generated
      ? `<span class="cover-source cover-source-static">${s('card.coverGenerated')}</span>`
      : `<a class="cover-source" href="${esc(image.readme)}" target="_blank" rel="noopener noreferrer" aria-label="${s('card.coverSourceLabel', { name: p.name })}">${s('card.coverSource')} <span aria-hidden="true">↗</span></a>`;
    const cls = detail ? 'project-cover detail-cover' : 'project-cover';
    return `<div class="${cls} ${p.tone}${image ? ' has-image' : ''}">${fallback}${image ? `<img class="cover-image" src="${image.src}" width="${image.width}" height="${image.height}" alt="${detail ? s('detail.heroAlt', { name: p.name }) : alt}" ${detail ? '' : 'loading="lazy" '}decoding="async">${credit}` : ''}</div>`;
  }
  function card(p) {
    const detail = detailHref(p.id);
    return `<article id="${p.id}" class="project-card" data-category="${p.category}" data-kind="${p.kind}">${cover(p)}<div class="card-top"><div class="project-icon ${p.tone}" aria-hidden="true">${esc(p.initial)}</div><span class="category-label">${esc(p.tag)}</span><a class="permalink" href="${detail}" aria-label="${s('card.permalink', { name: p.name })}">#</a></div><h3><a href="${detail}">${esc(p.name)}</a></h3><p class="entry-kind">${s(`category.${p.category}`)} · ${s(`kind.${p.kind}`)}</p><p class="target">${esc(p.target)}</p><p class="summary">${esc(p.summary)}</p><div class="status"><span class="status-dot" aria-hidden="true"></span>${esc(p.status)}</div><details><summary>${s('card.details')} <span aria-hidden="true">+</span></summary><div class="evidence-body"><p class="evidence-label">${s(`relationship.${p.relationship}`)}</p><p>${esc(p.evidenceScope)}</p><p><strong>${s('card.before')}</strong> ${esc(p.limitation)}</p>${p.licenseNote ? `<p>${esc(p.licenseNote)}</p>` : ''}<div class="source-links"><a href="${detail}">${s('card.openDetail')}</a>${ext(p.evidence, t('card.evidence'))}${p.secondary ? ext(p.secondary, p.secondaryLabel) : ''}${ext(p.url, t('detail.visit'))}</div></div></details><div class="card-bottom"><span>${p.licenseUrl ? ext(p.licenseUrl, p.license) : esc(p.license)}</span><span>${s('common.checked')} <time datetime="${p.checked}">${p.checked}</time></span></div></article>`;
  }
  const buttons = [['all', t('directory.all'), projects.length], ...groups.map(([key]) => [key, t(`category.${key}`), projects.filter(p => p.category === key).length])].map(([key, label, count]) => `<button type="button" data-filter="${key}" aria-pressed="${key === 'all'}">${esc(label)} <span>${count}</span></button>`).join('');
  const options = Object.keys(kinds).filter(key => projects.some(p => p.kind === key)).map(key => `<option value="${key}">${s(`kind.${key}`)}</option>`).join('');
  const flow = [1, 2, 3].map(i => `${i > 1 ? '<div class="flow-line" aria-hidden="true">↓</div>' : ''}<div class="flow-row${i === 2 ? ' highlight' : ''}"><span class="flow-index">0${i}</span><div><strong>${s(`hero.step${i}`)}</strong><span>${s(`hero.detail${i}`)}</span></div><span class="flow-symbol" aria-hidden="true">${['⌘', '⌕', '&lt;/&gt;'][i - 1]}</span></div>`).join('');
  const index = head('', { title: t('seo.homeTitle'), description: t('seo.homeDescription'), includeApp: true }) + nav('') + `<main id="main"><section class="hero wrap"><div class="hero-copy"><p class="eyebrow"><span class="live-dot" aria-hidden="true"></span>${s('hero.eyebrow')}</p><h1>${s('hero.title1')}<br><span>${s('hero.title2')}</span></h1><p class="hero-lead">${s('hero.lead')} <strong>${s('hero.optional')}</strong> ${s('hero.sources')}</p><div class="hero-actions"><a class="button primary" href="#directory">${s('hero.explore')} <span aria-hidden="true">↓</span></a><a class="text-link" href="#get-started">${s('hero.start')} <span aria-hidden="true">↗</span></a></div><p class="hero-note">${s('hero.note')}</p></div><div class="hero-visual" aria-label="${s('hero.visual')}"><div class="terminal-bar"><span aria-hidden="true">● ● ●</span><span>${s('hero.loop')}</span><span aria-hidden="true">↗</span></div><div class="terminal-body"><p class="terminal-comment">${s('hero.comment')}</p>${flow}<div class="terminal-bottom"><span class="live-dot" aria-hidden="true"></span>${s('hero.bottom')}<span class="terminal-cursor" aria-hidden="true">▍</span></div></div></div></section>
<section class="trust-strip wrap" aria-label="${s('stats.label')}"><div><strong>${projects.length}</strong><span>${s('stats.entries')}</span></div><div><strong>${groups.length}</strong><span>${s('stats.categories')}</span></div><div><strong>100%</strong><span>${s('stats.sources')}</span></div><p>${s('stats.read')}<br><span>${s('stats.limits')}</span></p></section>
<section class="directory wrap section" id="directory"><div class="section-heading"><div><p class="eyebrow">${s('directory.eyebrow')}</p><h2>${s('directory.title')}</h2><p>${s('directory.lead')}</p></div><span class="review-date">${s('common.review')} <time datetime="${checked}">${checked}</time></span></div><div class="directory-tools" hidden><div class="search-wrap"><span aria-hidden="true">⌕</span><label class="sr-only" for="search">${s('directory.searchLabel')}</label><input id="search" type="search" maxlength="200" placeholder="${s('directory.searchPlaceholder')}" autocomplete="off"></div><div class="kind-filter"><label for="kind-filter">${s('directory.type')}</label><select id="kind-filter"><option value="all">${s('directory.allTypes')}</option>${options}</select></div><div class="filters" role="group" aria-label="${s('directory.filterLabel')}">${buttons}</div></div><div class="results-line"><p id="result-count" data-template="${esc(t('directory.count', { visible: '{visible}', total: '{total}' }))}" role="status" aria-live="polite">${s('directory.initialCount', { total: projects.length })}</p><span>${s('directory.audit')} <a href="${methodPath}" aria-label="${s('directory.method')}">↗</a></span></div><div class="project-grid">${projects.map(card).join('')}</div><div id="empty-results" class="empty-results" hidden><h3>${s('directory.emptyTitle')}</h3><p>${s('directory.emptyText')}</p><button class="button primary" type="button" id="reset-search">${s('directory.reset')}</button></div><noscript><p class="notice">${s('directory.nojs')}</p></noscript></section>
<section class="alternatives wrap" id="alternatives"><div class="zero" aria-hidden="true">≠<span>${s('alternatives.parity')}</span></div><div><p class="eyebrow">${s('alternatives.eyebrow')}</p><h2>${s('alternatives.title')}</h2><p>${s('alternatives.text')}</p><a class="text-link" href="${methodPath}#inclusion">${s('alternatives.method')} <span aria-hidden="true">→</span></a></div></section>
<section class="start-section wrap section" id="get-started"><div><p class="eyebrow">${s('start.eyebrow')}</p><h2>${s('start.title1')}<br>${s('start.title2')}</h2><p>${s('start.text1')}</p><p>${s('start.text2')}</p>${ext('https://rea.tools/guides/', t('start.guides'), 'text-link')}</div><div class="setup-card"><span class="setup-step">${s('setup.eyebrow')}</span><h3>${s('setup.title')}</h3><div class="command"><code>npx rea-agents setup</code><button type="button" id="copy-command" aria-label="${s('setup.copyLabel')}" hidden>${s('setup.copy')}</button></div><p id="copy-status" class="copy-status" data-success="${s('setup.success')}" data-failure="${s('setup.failure')}" role="status" aria-live="polite"></p><p>${s('setup.requirements')}</p>${ext('https://github.com/morluto/rea#quick-start', t('setup.quickStart'), 'text-link')}<div class="official-sources"><strong>${s('setup.official')}</strong><div>${ext('https://github.com/morluto/rea', 'GitHub')}${ext('https://www.npmjs.com/package/rea-agents', 'npm: rea-agents')}${ext('https://rea.tools/', 'rea.tools')}</div><p>${s('setup.token')}</p></div></div></section>
<section class="faq-section wrap section" id="faq"><div><p class="eyebrow">${s('faq.eyebrow')}</p><h2>${s('faq.title1')}<br>${s('faq.title2')}</h2></div><div class="faq-list">${[1, 2, 3, 4, 5, 6].map(i => `<details><summary>${s(`faq.q${i}`)}<span aria-hidden="true">+</span></summary><p>${s(`faq.a${i}`)}</p>${i === 6 ? `<p><a href="${issueLinks.suggest}">${s('footer.suggest')}</a> · <a href="${issueLinks.correction}">${s('footer.correct')}</a></p>` : ''}</details>`).join('')}</div></section><section class="contribute wrap"><div><p class="eyebrow">${s('contribute.eyebrow')}</p><h2>${s('contribute.title')}</h2><p>${s('contribute.text')}</p></div><a class="button primary" href="${issueLinks.suggest}">${s('footer.suggest')} <span aria-hidden="true">↗</span></a></section></main>` + footer;
  const paragraphs = (...keys) => keys.map(key => `<p>${s(key)}</p>`).join('');
  const section = (title, keys, id = '', links = '') => `<section${id ? ` id="${id}"` : ''}><h2>${s(title)}</h2>${paragraphs(...keys)}${links}</section>`;
  const method = head('method/', { title: t('seo.methodTitle'), description: t('seo.methodDescription') }) + nav('method/') + `<main id="main" class="method wrap"><a class="text-link" href="${home}">← ${s('method.back')}</a><p class="eyebrow">${s('method.eyebrow')}</p><h1>${s('method.title1')}<br>${s('method.title2')}</h1><p class="method-lead">${s('method.lead')}</p>
${section('method.checkedTitle', ['method.checked1', 'method.checked2'])}
<section><h2>${s('method.relationshipsTitle')}</h2><dl>${relationships.map((key, i) => `<dt>${s(`relationship.${key}`)}</dt><dd>${s(`method.relationship${i + 1}`)}</dd>`).join('')}</dl></section>
${section('method.taxonomyTitle', ['method.taxonomy1', 'method.taxonomy2', 'method.taxonomy3'], '', `<p>${ext(repository + '/blob/main/src/projects.json', t('method.catalogLink'))}</p>`)}
${section('method.inclusionTitle', ['method.inclusion1', 'method.inclusion2', 'method.inclusion3'], 'inclusion')}
${section('method.rightsTitle', ['method.rights1', 'method.rights2', 'method.rights3'])}
${section('method.correctionsTitle', ['method.corrections1', 'method.corrections2'], 'corrections', `<p><a href="${issueLinks.suggest}">${s('footer.suggest')}</a> · <a href="${issueLinks.correction}">${s('footer.correct')}</a> · <a href="${issueLinks.bug}">${s('method.bugLink')}</a></p><p>${ext(repository + '/blob/main/' + (locale === 'en' ? 'CONTRIBUTING.md' : 'CONTRIBUTING.zh-CN.md'), t('method.guideLink'))} · ${ext('https://github.com/kaixinbaba', t('method.maintainerLink'))}</p>`)}
${section('method.privacyTitle', ['method.privacy1', 'method.privacy2', 'method.privacy3'], 'privacy')}<p class="review-date">${s('method.reviewed')} ${checked}</p></main>` + footer;
  const notFound = head('404.html', { title: t('seo.notFoundTitle'), description: t('seo.notFoundDescription'), noindex: true }) + nav('404.html') + `<main id="main" class="not-found wrap"><p class="eyebrow">${s('notFound.eyebrow')}</p><h1>${s('notFound.title1')}<br>${s('notFound.title2')}</h1><p>${s('notFound.text')}</p><a class="button primary" href="${home}">${s('method.back')} →</a></main>` + footer;
  await mkdir(`dist${methodPath}`, { recursive: true });
  await writeFile(`dist${home}index.html`, index);
  await writeFile(`dist${methodPath}index.html`, method);
  await writeFile(`dist${home}404.html`, notFound);
  sitemapPages.push('', 'method/');

  for (const [key] of groups) {
    const page = categoryPage(key);
    const items = projects.filter(p => p.category === key);
    const catTitle = t('seo.categoryTitle', { category: t(`category.${key}`) });
    const catDesc = t('seo.categoryDescription', { category: t(`category.${key}`) });
    const html = head(page, { title: catTitle, description: catDesc }) + nav(page) + `<main id="main" class="category-page wrap"><a class="text-link" href="${home}#directory">← ${s('category.back')}</a><p class="eyebrow">${s('directory.eyebrow')}</p><h1>${s(`category.${key}`)}</h1><p class="category-lead">${s('category.lead')}</p><p class="review-date">${s('category.count', { count: items.length })} · ${s('common.review')} <time datetime="${checked}">${checked}</time></p><div class="project-grid category-grid">${items.map(card).join('')}</div></main>` + footer;
    await mkdir(`dist${localePath(locale, page)}`, { recursive: true });
    await writeFile(`dist${localePath(locale, page)}index.html`, html);
    sitemapPages.push(page);
  }

  for (const p of projects) {
    const page = projectPage(p.id);
    const title = t('seo.projectTitle', { name: p.name });
    const description = t('seo.projectDescription', { summary: p.summary });
    const projectLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      url: `${origin}${detailHref(p.id)}`,
      description: p.summary,
      applicationCategory: t(`category.${p.category}`),
      operatingSystem: p.target,
      license: p.licenseUrl || undefined,
    }).replaceAll('<', '\\u003c');
    const html = head(page, {
      title,
      description,
      extraJsonLd: `<script type="application/ld+json">${projectLd}</script>`,
    }) + nav(page) + `<main id="main" class="project-detail wrap">
<nav class="detail-nav" aria-label="breadcrumb"><a class="text-link" href="${home}#directory">← ${s('detail.backHome')}</a><a class="text-link" href="${categoryHref(p.category)}">${s('detail.backCategory', { category: t(`category.${p.category}`) })}</a></nav>
${cover(p, { detail: true })}
<header class="detail-header"><p class="eyebrow">${esc(p.tag)}</p><h1>${esc(p.name)}</h1>
<p class="entry-kind">${s('detail.category')}: ${s(`category.${p.category}`)} · ${s('detail.kind')}: ${s(`kind.${p.kind}`)}</p>
<p class="target"><strong>${s('detail.target')}:</strong> ${esc(p.target)}</p>
<div class="detail-actions">${ext(p.url, t('detail.visit'), 'button primary')}<a class="text-link" href="${categoryHref(p.category)}">${s(`category.${p.category}`)} →</a></div>
</header>
<section class="detail-body">
<p class="detail-summary">${esc(p.summary)}</p>
${blurbs[p.id]?.[locale] ? `<p class="detail-blurb">${esc(blurbs[p.id][locale])}</p>` : ''}
<div class="detail-panel">
<p><span class="evidence-label">${s('detail.relationship')}</span><br>${s(`relationship.${p.relationship}`)}</p>
<p><span class="evidence-label">${s('detail.scope')}</span><br>${esc(p.evidenceScope)}</p>
<p><span class="evidence-label">${s('detail.limits')}</span><br>${esc(p.limitation)}</p>
<p><span class="evidence-label">${s('detail.status')}</span><br>${esc(p.status)}</p>
<p><span class="evidence-label">${s('detail.license')}</span><br>${p.licenseUrl ? ext(p.licenseUrl, p.license) : esc(p.license)}${p.licenseNote ? `<br>${esc(p.licenseNote)}` : ''}</p>
<p><span class="evidence-label">${s('detail.checked')}</span><br><time datetime="${p.checked}">${p.checked}</time></p>
<div class="source-links">${ext(p.evidence, t('detail.evidence'))}${p.secondary ? ext(p.secondary, p.secondaryLabel || t('detail.secondary')) : ''}</div>
</div>
</section>
</main>` + footer;
    await mkdir(`dist${localePath(locale, page)}`, { recursive: true });
    await writeFile(`dist${localePath(locale, page)}index.html`, html);
    sitemapPages.push(page);
  }
}

await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const uniquePages = [...new Set(sitemapPages)];
const sitemapItems = Object.keys(locales).flatMap(locale => uniquePages.map(page => `<url><loc>${origin}${localePath(locale, page)}</loc><lastmod>${checked}</lastmod>${Object.entries(locales).map(([code, l]) => `<xhtml:link rel="alternate" hreflang="${l.lang}" href="${origin}${localePath(code, page)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localePath('en', page)}"/></url>`));
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemapItems.join('')}</urlset>`);
await writeFile('dist/_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms https://*.clarity.ms https://analytics.murdoku.fans ${hashes.map(hash => `'sha256-${hash}'`).join(' ')}; style-src 'self'; img-src 'self' data: https://www.google-analytics.com https://region1.google-analytics.com https://c.bing.com https://c.clarity.ms https://fazier.com; font-src 'self'; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://analytics.murdoku.fans; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\n`);
const pageCount = Object.keys(locales).length * (2 + populatedCategories(source).length + source.length);
console.log(`Built ${Object.keys(locales).length} locales, ${pageCount} indexable HTML routes + localized 404s, ${source.length} entries, ${Object.keys(covers).length} covers → dist/ (${origin}); sitemap urls=${sitemapItems.length}`);
