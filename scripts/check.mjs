import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { loadProjects, issueLinks, populatedCategories, kinds } from './catalog.mjs';
const data = await loadProjects();
for(const path of ['index.html','method/index.html','404.html']){
 const html=await readFile(`dist/${path}`,'utf8');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${path}: one h1`);
 assert(html.includes('<html lang="en">'));
 assert(html.includes('name="description"'));
 assert(html.includes('rel="canonical"'));
 assert(!/https:\/\/(?:claude\.ai|(?:[^/]+\.)?anthropic\.com)/i.test(html));
 for(const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"#?]*)/g)){
   const local=decodeURIComponent(match[1]);
   if(!local)continue;
   const target='dist'+local+(local.endsWith('/')?'index.html':'');
   assert((await stat(target)).isFile(),`Missing internal asset: ${target}`);
 }
 if(path==='404.html')assert(html.includes('content="noindex"'));else assert(!html.includes('content="noindex"'));
}
const html=await readFile('dist/index.html','utf8');
assert.equal((html.match(/class="project-card"/g)||[]).length,data.length);
for(const p of data) {
 assert(html.includes(`id="${p.id}" class="project-card" data-category="${p.category}" data-kind="${p.kind}"`));
 assert(html.includes(p.evidence), `${p.id}: primary evidence missing`);
}
for(const [key] of populatedCategories(data)) assert(html.includes(`data-filter="${key}"`));
for(const key of Object.keys(kinds).filter(k=>data.some(p=>p.kind===k))) assert(html.includes(`<option value="${key}">`));
const method=await readFile('dist/method/index.html','utf8');
for(const url of Object.values(issueLinks)) {
 assert(method.includes(url), `Missing contribution link: ${url}`);
 const file=new URL(url).searchParams.get('template');
 assert((await stat(`.github/ISSUE_TEMPLATE/${file}`)).isFile());
 const form=await readFile(`.github/ISSUE_TEMPLATE/${file}`,'utf8');
 assert(form.includes('body:') && form.includes('required: true'));
 assert(form.includes('中文'));
}
assert(!html.includes('mailto:'), 'Use repository contribution forms');
assert(!method.includes('Three different REA connections'));
const structured=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(structured.numberOfItems,data.length);
assert.equal(structured.itemListElement.length,data.length);
assert.equal((await stat('dist/og.png')).size>0,true);
const sitemap=await readFile('dist/sitemap.xml','utf8');
assert.equal((sitemap.match(/<loc>/g)||[]).length,2);
assert(!sitemap.includes('404'));
console.log(`PASS: ${data.length} entry contracts, 3 HTML pages, all local references, structured data, sitemap and metadata`);
