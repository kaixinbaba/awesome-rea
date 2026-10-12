import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { loadProjects, populatedCategories, kinds, issueLinks } from './catalog.mjs';
const catalog = await loadProjects();
const total = catalog.length;
const purposes = ['all', ...populatedCategories(catalog).map(([key])=>key)];
const types = ['all', ...Object.keys(kinds).filter(key=>catalog.some(p=>p.kind===key))];
const base=process.env.TEST_URL||'http://127.0.0.1:4387';
const targetOrigin=new URL(base).origin;
const out=process.env.TEST_OUTPUT||'test-results/local';
await mkdir(out,{recursive:true});
const report={base,startedAt:new Date().toISOString(),contexts:[],errors:[]};
for(const [name,engine,widths] of [['chromium',chromium,[1440,768,390,320]],['webkit',webkit,[1440,390]]]){
 const browser=await engine.launch({headless:true});
 try {
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];const requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
   page.on('request',req=>requests.push(req.url()));
   page.on('requestfailed',req=>errors.push(`${req.url()}: ${req.failure()?.errorText}`));
   const response=await page.goto(base,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   assert.equal(await page.locator('.project-card:visible').count(),total);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('meta[name="robots"][content="noindex"]').count(),0);
   assert(await page.locator('link[rel="canonical"]').getAttribute('href'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${name} ${width}`);
   await page.keyboard.press(name === 'webkit' ? 'Alt+Tab' : 'Tab');
   assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Skip to content');
   await page.evaluate(()=>document.activeElement.blur());
   if(name==='chromium'&&(width===1440||width===390)){
    await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});
    await page.screenshot({path:`${out}/first-screen-${width}.png`});
   }
   for(const purpose of purposes){
    await page.locator(`[data-filter="${purpose}"]`).click();
    for(const type of types){
     await page.locator('#kind-filter').selectOption(type);
     const expected=catalog.filter(p=>(purpose==='all'||p.category===purpose)&&(type==='all'||p.kind===type)).map(p=>p.id);
     const actual=await page.locator('.project-card:visible').evaluateAll(nodes=>nodes.map(n=>n.id));
     assert.deepEqual(actual,expected,`${purpose} + ${type}`);
     assert.equal(await page.locator('#empty-results').isVisible(),expected.length===0);
     assert.equal(await page.locator('#result-count').textContent(),`Showing ${expected.length} of ${total} entries`);
    }
    assert.equal(await page.locator('[data-filter][aria-pressed="true"]').count(),1);
   }
   await page.locator('[data-filter="all"]').click();
   await page.locator('#kind-filter').selectOption('all');
   await page.locator('#search').fill('NOTION');
   assert.equal(await page.locator('.project-card:visible').count(),1);
   assert(await page.locator('#notion').isVisible());
   await page.locator('#search').fill('unfindable <script>alert(1)</script>');
   assert.equal(await page.locator('.project-card:visible').count(),0);
   assert(await page.locator('#empty-results').isVisible());
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
   await writeFile(`${out}/axe-${name}-${width}.json`,JSON.stringify(a11y.violations,null,2));
   assert.equal(a11y.violations.length,0,JSON.stringify(a11y.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
   assert.equal(requests.filter(url=>new URL(url).origin!==targetOrigin).length,0,'Unexpected third-party network requests');
   assert.equal((await context.cookies()).length,0);
   assert.equal(await page.evaluate(()=>localStorage.length),0);
   if(name==='chromium'&&width===1440){
    await context.grantPermissions(['clipboard-read','clipboard-write']);
    await page.locator('#copy-command').click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'npx rea-agents setup');
    await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new Error('denied'));});
    await page.locator('#copy-command').click();
    await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.includes('Clipboard unavailable'));
   }
   await page.goto(base+'/method/',{waitUntil:'networkidle'});
   for(const link of Object.values(issueLinks)) assert(await page.locator(`a[href="${link}"]`).count()>0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const methodA11y=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.equal(methodA11y.violations.length,0,JSON.stringify(methodA11y.violations.map(v=>v.id)));
   assert.equal(errors.length,0,errors.join('\n'));
   report.contexts.push({engine:name,width,cards:total,purposeTypeCombinations:purposes.length*types.length,issueLinks:3,search:true,emptyReset:true,hashRecovery:true,details:true,axeViolations:0,thirdPartyRequests:0,errors});
   await context.close();
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const p=await nojs.newPage();
  await p.goto(base);
  assert.equal(await p.locator('.project-card:visible').count(),total);
  assert.equal(await p.locator('.directory-tools:visible').count(),0);
  await p.locator('#notion summary').click();
  assert(await p.locator('#notion .evidence-body').isVisible());
  assert.equal((await p.goto(base+'/missing-page-for-test')).status(),404);
  assert.equal(await p.locator('meta[name="robots"]').getAttribute('content'),'noindex');
  report.contexts.push({engine:name,javascript:false,cards:total,details:true,notFound:404});
  await nojs.close();
 } finally {await browser.close();}
}
report.completedAt=new Date().toISOString();
await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2));
console.log(`PASS: ${report.contexts.length} browser contexts; Chromium + WebKit, 320–1440px, filters/search, clipboard, no-JS, 404, zero axe violations`);
