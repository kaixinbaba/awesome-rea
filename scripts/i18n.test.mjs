import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadProjects } from './catalog.mjs';
import { displayFields, locales, localePath, loadLocale, sourceHash, validateMessages, validateTranslations } from './i18n.mjs';
import { renderCatalog, updateReadme } from './readme.mjs';
const source = await loadProjects();
const en = await loadLocale('en', source);
const zh = await loadLocale('zh-CN', source);
const translations = JSON.parse(await readFile('src/locales/projects.zh-CN.json', 'utf8'));
const mutate = fn => { const copy = structuredClone(translations); fn(copy); return copy; };

test('locales have stable separate paths; unsupported locales fail closed', async () => {
 assert.equal(localePath('en', 'method/'), '/method/');
 assert.equal(localePath('zh-CN', 'method/'), '/zh/method/');
 assert.throws(() => localePath('fr'));
 await assert.rejects(loadLocale('fr', source));
});
test('Chinese overlays only display fields; IDs, rights sources, classifications and dates remain identical', () => {
 assert.deepEqual(en.projects, source);
 assert.equal(zh.projects.length, source.length);
 for (let i = 0; i < source.length; i++) {
  for (const key of Object.keys(source[i]).filter(key => !displayFields.includes(key))) assert.equal(zh.projects[i][key], source[i][key], `${source[i].id}/${key}`);
  for (const key of displayFields.filter(key => Object.hasOwn(source[i], key))) assert.equal(zh.projects[i][key], translations[source[i].id][key]);
 }
});
for (const [label, change] of [
 ['missing entry', data => { delete data.photocraft; }],
 ['unknown entry', data => { data.unknown = data.photocraft; }],
 ['missing limitation', data => { delete data.photocraft.limitation; }],
 ['blank summary', data => { data.photocraft.summary = ' '; }],
 ['English fallback', data => { data.photocraft.limitation = source.find(p => p.id === 'photocraft').limitation; }],
 ['changed source URL', data => { data.photocraft.url = 'https://example.com/'; }],
 ['markup injection', data => { data.photocraft.summary = '<script>中文</script>'; }],
 ['control characters', data => { data.photocraft.summary = '中文\n第二行'; }],
 ['overlong short description', data => { data.photocraft.listSummary = '中'.repeat(161); }],
 ['stale hash', data => { data.photocraft.sourceHash = '0'.repeat(64); }],
]) test(`translation rejects ${label}`, () => assert.throws(() => validateTranslations(source, mutate(change))));

test('every source change requires translation review; source hash ignores property order', () => {
 const copy = structuredClone(source);
 copy[0].limitation += ' New restriction.';
 assert.throws(() => validateTranslations(copy, translations), /source changed/);
 assert.equal(sourceHash(source[0]), sourceHash(Object.fromEntries(Object.entries(source[0]).reverse())));
});
test('missing UI keys, extra keys, empty values, unsafe markup and mismatched placeholders fail', () => {
 for (const change of [
  messages => { delete messages['setup.failure']; },
  messages => { messages.extra = '多余'; },
  messages => { messages['nav.skip'] = ''; },
  messages => { messages['nav.skip'] = '<b>正文</b>'; },
  messages => { messages['directory.count'] = '共 {wrong} 项'; },
 ]) {
  const copy = structuredClone(zh.messages); change(copy);
  assert.throws(() => validateMessages(en.messages, copy));
 }
 assert.throws(() => zh.t('nonexistent'));
 assert.throws(() => zh.t('directory.count', { total: 36 }));
 assert.equal(zh.t('directory.count', { visible: 0, total: 36 }), '显示 0 个，共 36 个条目');
});
test('both README catalogs are flat, complete, deterministic and generated in their own language', async () => {
 for (const view of [en, zh]) {
  const text = await readFile(view.readme, 'utf8');
  assert.equal(updateReadme(text, view.projects, view.t), text);
  const rendered = renderCatalog(view.projects, view.t);
  assert.equal(rendered.split('\n').filter(line => line.startsWith('- ')).length, source.length);
  assert.equal(rendered.split('\n').filter(line => line.startsWith('### ')).length, 6);
  assert(!/^[ \t]+- /m.test(rendered));
  assert(text.includes(view.locale === 'en' ? 'README.zh-CN.md' : '(README.md)'));
  for (const p of view.projects) assert(rendered.includes(p.url));
 }
 assert(renderCatalog(zh.projects, zh.t).includes('桌面与效率应用'));
 assert(!renderCatalog(zh.projects, zh.t).includes('Early-alpha Photoshop-style'));
});
test('high-impact limitations survive translation', () => {
 const p = Object.fromEntries(zh.projects.map(p => [p.id, p]));
 assert(p.cadcraft.limitation.includes('丢弃') && p.cadcraft.limitation.includes('副本'));
 assert(p.effectcraft.limitation.includes('不支持 AEP/AEPX'));
 assert(p.photocraft.licenseNote.includes('更换品牌'));
 assert(p['rea-jev'].limitation.includes('放行') && p['rea-jev'].limitation.includes('费用'));
 assert(p.openrct2.limitation.includes('合法') && p.openrct2.limitation.includes('不包含原游戏素材'));
});
test('every localized social image is present and 1200 × 630', async () => {
 for (const { og } of Object.values(locales)) {
  const png = await readFile(`public/${og}`);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
 }
});
