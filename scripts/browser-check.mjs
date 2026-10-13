import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadProjects, populatedCategories, kinds, issueLinks } from './catalog.mjs';
import { locales, loadLocale, localePath } from './i18n.mjs';
import { loadCovers } from './covers.mjs';
const catalog = await loadProjects();
const covers = await loadCovers(catalog);
const total = catalog.length;
const purposes = ['all', ...populatedCategories(catalog).map(([key])=>key)];
const types = ['all', ...Object.keys(kinds).filter(key=>catalog.some(p=>p.kind===key))];
const base=(process.env.TEST_URL||'http://127.0.0.1:4387').replace(/\/$/,'');
const targetOrigin=new URL(base).origin;
const consentKey='awesomerea.analytics-consent.v1';
const out=process.env.TEST_OUTPUT||'test-results/local';
await mkdir(out,{recursive:true});
const report={base,startedAt:new Date().toISOString(),contexts:[],errors:[]};
for(const locale of Object.keys(locales)) {
 const {t, lang, projects: translated}=await loadLocale(locale,catalog);
 const home=base+localePath(locale);
 const other=Object.keys(locales).find(code=>code!==locale);
 const localeOut=`${out}/${locale}`;
 await mkdir(localeOut,{recursive:true});
 for(const [name,engine,widths] of [['chromium',chromium,[1440,768,390,320]],['webkit',webkit,[1440,390]]]){
 const browser=await engine.launch({headless:true});
 try {
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
   // Business/visual regressions decline analytics; never send test traffic to Google.
   await context.addInitScript(key=>{try{localStorage.setItem(key,JSON.stringify({version:1,choice:'rejected',at:Date.now()}));}catch{}},consentKey);
   const page=await context.newPage();
   const errors=[];const requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
   page.on('request',req=>requests.push(req.url()));
   page.on('requestfailed',req=>errors.push(`${req.url()}: ${req.failure()?.errorText}`));
   const response=await page.goto(home,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   assert.equal(await page.locator('.project-card:visible').count(),total);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('h1').innerText(),t('hero.title1')+'\n'+t('hero.title2'));
   assert.equal(await page.locator('[data-language][aria-current="page"]').getAttribute('data-language'),locale);
   for(const entry of translated) {
    const card=page.locator('#'+entry.id);
    assert.equal(await card.locator('.summary').textContent(),entry.summary);
    assert.equal(await card.locator('.evidence-label').textContent(),t(`relationship.${entry.relationship}`));
    assert((await card.locator('.evidence-body').textContent()).includes(entry.limitation));
    const image = card.locator('.cover-image');
    assert.equal(await image.count(), covers[entry.id] ? 1 : 0);
    assert.equal(await card.locator('.cover-fallback').count(), 1);
    if (covers[entry.id]) {
     assert.equal(await image.getAttribute('src'), covers[entry.id].src);
     assert.equal(await image.getAttribute('loading'), 'lazy');
     assert.equal(await image.getAttribute('alt'), t('card.coverAlt', { name: entry.name }));
     assert.equal(await card.locator('.cover-source').getAttribute('href'), covers[entry.id].readme);
    }
   }
   assert.equal(await page.locator('meta[name="robots"][content="noindex"]').count(),0);
   assert(await page.locator('link[rel="canonical"]').getAttribute('href'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${name} ${width}`);
   const visual=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
    const metadata=['.category-label','.entry-kind','.target','.status','.card-bottom','.results-line','.review-date','.hero-note','.filters button','.filters button span','.terminal-bar','.flow-row div>span','.terminal-bottom'];
    const small=metadata.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getBoundingClientRect().width>0&&parseFloat(getComputedStyle(el).fontSize)<11).map(el=>({selector,size:getComputedStyle(el).fontSize})));
    return {small,search:rect('.search-wrap'),select:rect('#kind-filter'),directory:rect('#directory'),heading:rect('.section-heading h2'),date:rect('.section-heading>.review-date'),hero:rect('.hero'),title:rect('.hero h1')};
   });
   assert.deepEqual(visual.small,[],`Small metadata at ${locale} ${name} ${width}`);
   assert.equal(visual.search.height,46);
   assert.equal(visual.select.height,46);
   if(width>=768) assert(Math.abs(visual.search.top-visual.select.top)<=1,'Desktop toolbar alignment');
   if(width===1440) assert(visual.search.bottom<=950,`Search must fit in the first desktop screen: ${locale}/${name} ${JSON.stringify(visual)}`);
   if(width===390) assert(visual.directory.top<(locale==='en'?1081:1041),'Mobile directory must start earlier');
   if(width<=620) assert(visual.date.top>=visual.heading.bottom,'Mobile review date must not squeeze the heading');
   await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.textContent),t('nav.skip'));
   await page.evaluate(()=>document.activeElement.blur());
   if(name==='chromium'&&(width===1440||width===390)){
    // Load offscreen previews for visual evidence, then restore the shipping lazy behavior.
    await page.locator('.cover-image').evaluateAll(images=>images.forEach(image=>{image.loading='eager';}));
    await page.waitForFunction(()=>[...document.querySelectorAll('.cover-image')].every(image=>image.complete&&image.naturalWidth>0));
    assert.equal(await page.locator('.project-cover.image-missing').count(),0);
    await page.locator('.cover-image').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    await page.screenshot({path:`${localeOut}/home-${width}.png`,fullPage:true});
    await page.screenshot({path:`${localeOut}/first-screen-${width}.png`});
    await page.locator('.cover-image').evaluateAll(images=>images.forEach(image=>{image.loading='lazy';}));
   }
   for(const purpose of purposes){
    await page.locator(`[data-filter="${purpose}"]`).click();
    for(const type of types){
     await page.locator('#kind-filter').selectOption(type);
     const expected=catalog.filter(p=>(purpose==='all'||p.category===purpose)&&(type==='all'||p.kind===type)).map(p=>p.id);
     const actual=await page.locator('.project-card:visible').evaluateAll(nodes=>nodes.map(n=>n.id));
     assert.deepEqual(actual,expected,`${purpose} + ${type}`);
     assert.equal(await page.locator('#empty-results').isVisible(),expected.length===0);
     assert.equal(await page.locator('#result-count').textContent(),t('directory.count',{visible:expected.length,total}));
    }
    assert.equal(await page.locator('[data-filter][aria-pressed="true"]').count(),1);
   }
   await page.locator('[data-filter="all"]').click();
   await page.locator('#kind-filter').selectOption('all');
   await page.locator('#search').fill('NOTION');
   assert.equal(await page.locator('.project-card:visible').count(),1);
   assert(await page.locator('#notion').isVisible());
   if(locale==='zh-CN') {
    for(const [word,id] of [['剪贴板','notion'],['图元','cadcraft']]) {
     await page.locator('#search').fill(word);
     assert.deepEqual(await page.locator('.project-card:visible').evaluateAll(nodes=>nodes.map(n=>n.id)),[id]);
    }
   }
   await page.locator('#search').fill('unfindable <script>alert(1)</script>');
   assert.equal(await page.locator('.project-card:visible').count(),0);
   assert(await page.locator('#empty-results').isVisible());
   assert.equal(await page.locator('#empty-results h3').textContent(),t('directory.emptyTitle'));
   await page.locator('#reset-search').click();
   assert.equal(await page.locator('.project-card:visible').count(),total);
   assert.equal(await page.locator('#kind-filter').inputValue(),'all');
   await page.locator('[data-filter="dev-tools"]').click();
   await page.locator('#kind-filter').selectOption('analysis');
   await page.locator('#search').fill('Ghidra');
   assert.equal(await page.locator('.project-card:visible').count(),1);
   assert(await page.locator('#netcat').isVisible());
   await page.evaluate(()=>{location.hash='dx-ball';});
   await page.waitForFunction(()=>!document.querySelector('#dx-ball').hidden);
   assert.equal(await page.locator('.project-card:visible').count(),total);
   assert.equal(await page.locator('#kind-filter').inputValue(),'all');
   assert.equal(await page.locator('[data-filter="all"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('.contribute a').getAttribute('href'),issueLinks.suggest);
   await page.locator('#dx-ball summary').click();
   assert(await page.locator('#dx-ball .evidence-body').isVisible());
   const a11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   await writeFile(`${localeOut}/axe-${name}-${width}.json`,JSON.stringify(a11y.violations,null,2));
   assert.equal(a11y.violations.length,0,JSON.stringify(a11y.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
   assert.equal(requests.filter(url=>new URL(url).origin!==targetOrigin).length,0,'Unexpected third-party network requests');
   assert.equal((await context.cookies()).length,0);
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[consentKey]);
   if(name==='chromium'&&width===1440){
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    await page.locator('#copy-command').click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'npx rea-agents setup');
    assert.equal(await page.locator('#copy-status').textContent(),t('setup.success'));
    await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('denied'));});
    await page.locator('#copy-command').click();
    await page.waitForFunction(expected=>document.querySelector('#copy-status').textContent===expected,t('setup.failure'));
   }
   await page.goto(base+localePath(locale,'method/'),{waitUntil:'networkidle'});
   for(const link of Object.values(issueLinks)) assert(await page.locator(`a[href="${link}"]`).count()>0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const methodA11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.equal(methodA11y.violations.length,0,JSON.stringify(methodA11y.violations.map(v=>v.id)));
   await page.goto(base+localePath(locale,'method/')+'?language-check=1#inclusion',{waitUntil:'networkidle'});
   await page.locator(`[data-language="${other}"]`).click();
   await page.waitForURL(base+localePath(other,'method/')+'?language-check=1#inclusion');
   assert.equal(await page.locator('html').getAttribute('lang'),locales[other].lang);
   await page.goto(home+'?language-check=1#photocraft',{waitUntil:'networkidle'});
   await page.locator(`[data-language="${other}"]`).click();
   await page.waitForURL(base+localePath(other)+'?language-check=1#photocraft');
   assert(await page.locator('#photocraft').isVisible());
   await page.locator(`[data-language="${locale}"]`).click();
   await page.waitForURL(home+'?language-check=1#photocraft');
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('.project-card:visible').count(),total);
   assert.equal((await context.cookies()).length,0);
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[consentKey]);
   assert.equal(requests.filter(url=>new URL(url).origin!==targetOrigin).length,0);
   assert.equal(errors.length,0,errors.join('\n'));
   report.contexts.push({locale,engine:name,width,visual,languageRoundTrip:true,cards:total,purposeTypeCombinations:purposes.length*types.length,issueLinks:3,search:true,emptyReset:true,hashRecovery:true,details:true,axeViolations:0,thirdPartyRequests:0,errors});
   await context.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const p=await nojs.newPage();
  await p.goto(home);
  assert.equal(await p.locator('.project-card:visible').count(),total);
  assert.equal(await p.locator('.directory-tools:visible').count(),0);
  assert.equal(await p.locator('.cover-image').count(),Object.keys(covers).length);
  await p.locator('#dx-ball .cover-image').scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('#dx-ball .cover-image').naturalWidth>0);
  await p.locator('#notion summary').click();
  assert(await p.locator('#notion .evidence-body').isVisible());
  await p.locator(`[data-language="${other}"]`).click();
  // A navigation can commit before its streamed catalog has finished parsing.
  await p.waitForURL(base+localePath(other),{waitUntil:'load'});
  assert.equal(await p.locator('html').getAttribute('lang'),locales[other].lang);
  assert.equal(await p.locator('.project-card:visible').count(),total);
  assert.equal((await p.goto(home+'missing-page-for-test')).status(),404);
  assert.equal(await p.locator('html').getAttribute('lang'),lang);
  assert.equal(await p.locator('h1').innerText(),t('notFound.title1')+'\n'+t('notFound.title2'));
  assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex');
  report.contexts.push({locale,engine:name,javascript:false,languageSwitch:true,cards:total,details:true,notFound:404});
  await nojs.close();
  if(name==='chromium') {
   const failed=await browser.newContext({viewport:{width:390,height:950},reducedMotion:'reduce'});
   await failed.addInitScript(key=>localStorage.setItem(key,JSON.stringify({version:1,choice:'rejected',at:Date.now()})),consentKey);
   let release;const gate=new Promise(resolve=>{release=resolve;});
   await failed.route(base+covers['dx-ball'].src,async route=>{await gate;await route.fulfill({status:404,body:''});});
   const fallbackPage=await failed.newPage();const requests=[];
   fallbackPage.on('request',request=>requests.push(request.url()));
   await fallbackPage.goto(home,{waitUntil:'domcontentloaded'});
   const area=fallbackPage.locator('#dx-ball .project-cover');
   await area.scrollIntoViewIfNeeded();const before=await area.boundingBox();release();
   await fallbackPage.waitForFunction(()=>document.querySelector('#dx-ball .project-cover').classList.contains('image-missing'));
   assert.equal(await fallbackPage.locator('#dx-ball .cover-image').isVisible(),false);
   assert(await fallbackPage.locator('#dx-ball .cover-fallback').isVisible());
   const after=await area.boundingBox();assert(Math.abs(before.height-after.height)<1,'Failed image must not collapse its card');
   await fallbackPage.locator('#search').fill('DX-Ball 1.07');
   assert.deepEqual(await fallbackPage.locator('.project-card:visible').evaluateAll(nodes=>nodes.map(node=>node.id)),['dx-ball']);
   assert.equal(requests.filter(url=>new URL(url).origin!==targetOrigin).length,0);
   await fallbackPage.screenshot({path:`${localeOut}/cover-fallback.png`,fullPage:false});
   report.contexts.push({locale,engine:name,width:390,coverFailure:true,layoutStable:true,search:true,thirdPartyRequests:0});
   await failed.close();
  }
 } finally {await browser.close();}
 }
}
report.completedAt=new Date().toISOString();
await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2));
console.log(`PASS: ${report.contexts.length} browser contexts; both locales, Chromium + WebKit, 320–1440px, filters/search, clipboard, language switching, no-JS, localized 404, zero axe violations`);
