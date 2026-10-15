// Mock-only privacy regression: no real Google traffic, including on the production origin.
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { loadProjects } from './catalog.mjs';
import { loadCovers } from './covers.mjs';
const projects=await loadProjects();
const projectCount=projects.length;
const coverPaths=Object.values(await loadCovers(projects)).map(cover=>cover.src);
const ID='G-KFLGGK81K8', KEY='awesomerea.analytics-consent.v1', DAY=86400000;
const out=process.env.ANALYTICS_OUTPUT||'test-results/analytics-local';
await mkdir(out,{recursive:true});
const mockTag=`(() => {
 const original=window.gtag;
 window.gtag=function(...args){
  original(...args);
  if(args[0]==='event'&&args[1]==='page_view'&&!window['ga-disable-${ID}']){
   document.cookie='_ga=fixture; Path=/; Secure; SameSite=Lax';
   document.cookie='_ga_${ID.slice(2)}=fixture; Path=/; Domain=awesomerea.com; Secure; SameSite=Lax';
   void fetch('https://www.google-analytics.com/g/collect',{method:'POST',body:JSON.stringify(args[2])});
  }
 };
})();`;
const headers=Object.fromEntries((await readFile('dist/_headers','utf8')).split('\n').filter(l=>l.startsWith('  ')).map(l=>{const i=l.indexOf(':');return [l.slice(2,i),l.slice(i+1).trim()];}));
const results=[];
async function fixture(browser,{origin='https://awesomerea.com',seed,signal,storageBlocked=false,blocked=false,gate,javascript=true,width=390}={}){
 const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce',javaScriptEnabled:javascript});
 const traffic={tags:0,collect:[],unexpected:[]};
 await context.addInitScript(({key,seed,signal,storageBlocked})=>{
  if(seed!==undefined)localStorage.setItem(key,typeof seed==='string'?seed:JSON.stringify(seed));
  if(signal==='DNT')Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});
  if(signal==='GPC')Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});
  if(storageBlocked){Storage.prototype.getItem=()=>{throw Error('blocked storage');};Storage.prototype.setItem=()=>{throw Error('blocked storage');};}
 },{key:KEY,seed,signal,storageBlocked});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin){
   const path=decodeURIComponent(url.pathname);const allowed=['/','/zh/','/method/','/zh/method/','/styles.css','/analytics.js','/locale.js','/app.js','/favicon.svg',...coverPaths];
   const file=allowed.includes(path)?(path.endsWith('/')?path+'index.html':path):(path.startsWith('/zh/')?'/zh/404.html':'/404.html');
   const type=file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webp')?'image/webp':'text/html';
   await route.fulfill({status:allowed.includes(path)?200:404,headers:{...headers,'Content-Type':type},body:await readFile('dist'+file)});
  }else if(url.hostname==='www.googletagmanager.com'&&url.pathname==='/gtag/js'){
   traffic.tags++;assert.equal(url.searchParams.get('id'),ID);
   if(gate)await gate;
   if(blocked)await route.abort('blockedbyclient');else await route.fulfill({contentType:'text/javascript',body:mockTag});
  }else if(url.hostname==='www.google-analytics.com'&&url.pathname==='/g/collect'){
   traffic.collect.push(JSON.parse(route.request().postData()));await route.fulfill({status:204});
  }else if(url.hostname==='www.clarity.ms'||url.hostname==='scripts.clarity.ms'||url.hostname.endsWith('.clarity.ms')||url.hostname==='c.bing.com'){
   // Production-gated Clarity loader is expected on the mocked production origin; never hit the real network.
   await route.abort();
  }else if(url.hostname==='analytics.murdoku.fans'){
   // Production-gated Umami loader is expected on the mocked production origin; never hit the real network.
   await route.abort();
  }else {traffic.unexpected.push(url.origin+url.pathname);await route.abort();}
 });
 const page=await context.newPage();return {context,page,traffic,origin};
}
const choice=(value,at=Date.now())=>({version:1,choice:value,at});
async function assertFits(f,label){
 const layout=await f.page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('*')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.right>innerWidth+.1;}).slice(0,12).map(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return {tag:x.tagName,id:x.id,className:x.className,right:r.right,width:r.width,minWidth:s.minWidth,whiteSpace:s.whiteSpace};})}));
 assert(layout.scrollWidth<=layout.width,`${label}: ${JSON.stringify(layout)}`);
}
for(const [engine,launcher]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true});
 try{
  for(const [locale,path]of [['en','/'],['zh-CN','/zh/']]){
   const f=await fixture(browser,{width:locale==='en'?1440:390});
   await f.context.addCookies([{name:'unrelated',value:'fixture',domain:'awesomerea.com',path:'/',secure:true}]);
   await f.page.goto(f.origin+path+'?q=private-search#private-fragment',{waitUntil:'networkidle',referer:'https://search.example/private?email=private'});
   assert.equal(f.traffic.tags,0);assert.equal(f.traffic.collect.length,0);
   assert(await f.page.locator('#analytics-consent').isVisible());
   await assertFits(f,`${engine}/${locale}/initial-consent`);
   const a11y=await new AxeBuilder({page:f.page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a11y.violations.map(v=>v.id),[]);
   await f.page.screenshot({path:`${out}/${engine}-${locale}-consent.png`});
   await Promise.all([f.page.waitForResponse(r=>r.url().includes('/g/collect')),f.page.locator('#analytics-accept').click()]);
   await f.page.waitForFunction(()=>!!window.dataLayer&&Array.from(window.dataLayer).some(a=>a[0]==='event'));
   assert.equal(f.traffic.tags,1);assert.equal(f.traffic.collect.length,1);
   assert.equal(f.traffic.collect[0].page_location,f.origin+path);assert.equal(f.traffic.collect[0].page_referrer,'https://search.example');
   const config=await f.page.evaluate(()=>Array.from(window.dataLayer).map(a=>Array.from(a)).find(a=>a[0]==='config')[2]);
   assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);
   assert.equal(config.page_location,f.origin+path);assert.equal(config.cookie_expires,180*86400);
   await f.page.locator('#search').fill('NOTION');
   await f.page.locator('#analytics-settings').click();await f.page.locator('#analytics-reject').click();
   assert.equal(await f.page.evaluate(id=>window['ga-disable-'+id],ID),true);
   assert.deepEqual((await f.context.cookies()).map(c=>c.name),['unrelated']);
   assert.equal(await f.page.locator('#search').inputValue(),'NOTION');assert.equal(await f.page.locator('.project-card:visible').count(),1);
   await f.page.locator('#analytics-settings').click();await f.page.locator('#analytics-accept').click();
   assert.equal(f.traffic.tags,1);assert.equal(f.traffic.collect.length,1,'Reallowing must not duplicate the same document pageview');
   const second=await f.context.newPage();await second.goto(f.origin+(locale==='en'?'/zh/':'/')+'?q=private',{waitUntil:'networkidle'});
   assert.equal(f.traffic.collect.length,2,'Saved consent works in the other language');
   await f.page.locator('#analytics-settings').click();await f.page.locator('#analytics-reject').click();
   await second.waitForFunction(id=>window['ga-disable-'+id]===true,ID);
   assert.deepEqual((await f.context.cookies()).map(c=>c.name),['unrelated']);
   assert.equal(f.traffic.collect.length,2);assert.deepEqual(f.traffic.unexpected,[]);
   results.push({engine,locale,case:'allow-withdraw-reallow-cross-tab',mockPageviews:2,axeViolations:0});await f.context.close();
  }
  for(const [name,options]of [
   ['declined',{seed:choice('rejected')}],['expired',{seed:choice('accepted',Date.now()-181*DAY)}],
   ['future',{seed:choice('accepted',Date.now()+DAY)}],['corrupt',{seed:'{bad'}],['missing-version',{seed:{choice:'accepted',at:Date.now()}}],
   ['DNT',{signal:'DNT',seed:choice('accepted')}],['GPC',{signal:'GPC',seed:choice('accepted')}],
   ['preview',{origin:'https://preview.awesomerea.pages.dev',seed:choice('accepted')}],['local',{origin:'http://127.0.0.1:4387',seed:choice('accepted')}],
  ]){
   const f=await fixture(browser,{...options,width:320});await f.page.goto(f.origin+'/',{waitUntil:'networkidle'});
   assert.equal(f.traffic.tags,0,name);assert.equal(f.traffic.collect.length,0,name);assert.equal(await f.page.evaluate(id=>window['ga-disable-'+id],ID),true);
   await f.page.locator('#analytics-settings').click();assert(await f.page.locator('#analytics-consent').isVisible());
   await assertFits(f,`${engine}/${name}/settings-consent`);
   if(options.signal)assert(await f.page.locator('#analytics-accept').isDisabled());
   assert.deepEqual(f.traffic.unexpected,[]);results.push({engine,case:name,mockPageviews:0});await f.context.close();
  }
  {
   const f=await fixture(browser,{storageBlocked:true});await f.page.goto(f.origin+'/',{waitUntil:'networkidle'});assert.equal(f.traffic.tags,0);
   await Promise.all([f.page.waitForResponse(r=>r.url().includes('/g/collect')),f.page.locator('#analytics-accept').click()]);assert.equal(f.traffic.collect.length,1);
   await f.page.reload({waitUntil:'networkidle'});assert.equal(f.traffic.tags,1);assert(await f.page.locator('#analytics-consent').isVisible());
   results.push({engine,case:'unavailable-storage-page-only',mockPageviews:1});await f.context.close();
  }
  {
   let release;const gate=new Promise(r=>{release=r;});const f=await fixture(browser,{gate});await f.page.goto(f.origin+'/',{waitUntil:'networkidle'});
   await f.page.locator('#analytics-accept').click();await f.page.waitForFunction(()=>!!document.querySelector('#awesomerea-ga'));
   await f.page.locator('#analytics-settings').click();await f.page.locator('#analytics-reject').click();release();
   await f.page.waitForFunction(()=>document.querySelector('#awesomerea-ga')&&Array.from(window.dataLayer).some(a=>a[0]==='consent'&&a[2]?.analytics_storage==='denied'));
   await f.page.waitForLoadState('networkidle');assert.equal(f.traffic.collect.length,0);assert.equal(await f.page.evaluate(id=>window['ga-disable-'+id],ID),true);
   results.push({engine,case:'withdraw-during-script-load',mockPageviews:0});await f.context.close();
  }
  {
   const f=await fixture(browser,{blocked:true});await f.page.goto(f.origin+'/',{waitUntil:'networkidle'});await f.page.locator('#analytics-accept').click();
   await f.page.waitForLoadState('networkidle');await f.page.locator('#search').fill('NOTION');assert.equal(await f.page.locator('.project-card:visible').count(),1);
   assert.equal(f.traffic.collect.length,0);results.push({engine,case:'blocked-script-business-works',mockPageviews:0});await f.context.close();
  }
  {
   const f=await fixture(browser,{seed:choice('accepted')});await f.page.goto(f.origin+'/',{waitUntil:'networkidle'});
   assert.equal(f.traffic.collect.length,1);await f.page.evaluate(day=>{const now=Date.now()+181*day;Date.now=()=>now;window.dispatchEvent(new Event('focus'));},DAY);
   assert.equal(await f.page.evaluate(id=>window['ga-disable-'+id],ID),true);assert.deepEqual((await f.context.cookies()).map(c=>c.name),[]);
   results.push({engine,case:'live-consent-expiry',mockPageviews:1});await f.context.close();
  }
  {
   const f=await fixture(browser,{javascript:false});await f.page.goto(f.origin+'/');assert.equal(await f.page.locator('.project-card:visible').count(),projectCount);
   assert.equal(await f.page.locator('#analytics-consent').isVisible(),false);assert.equal(f.traffic.tags,0);results.push({engine,case:'no-JS',mockPageviews:0});await f.context.close();
  }
 }finally{await browser.close();}
}
await writeFile(`${out}/verification.json`,JSON.stringify({mockOnly:true,realGoogleRequests:0,contexts:results},null,2));
console.log(`PASS: ${results.length} mock-only analytics contexts; no real Google requests`);
