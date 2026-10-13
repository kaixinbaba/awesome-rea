import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProjects, validateProjects, populatedCategories } from './catalog.mjs';
import { renderCatalog, updateReadme } from './readme.mjs';
import { loadCovers, validateCovers } from './covers.mjs';
const projects = await loadProjects();
const covers = await loadCovers(projects);
const changed = modify => { const copy = structuredClone(projects); modify(copy); return copy; };

test('purpose and output type stay independent; empty groups stay hidden', () => {
  assert.equal(projects.find(p => p.id === 'openbattlefield2').category, 'games');
  assert.equal(projects.find(p => p.id === 'openbattlefield2').relationship, 'REA tooling present');
  assert(!populatedCategories(projects.filter(p => p.category !== 'apps')).some(([key]) => key === 'apps'));
});
test('independent reimplementations and compatibility projects do not need REA provenance', () => {
  for (const relationship of ['Independent reimplementation', 'Compatibility project']) {
    const independent = changed(p => {
      p[0].relationship = relationship;
      p[0].evidenceScope = 'The author documents an independent implementation of a public file format.';
    });
    assert.doesNotThrow(() => validateProjects(independent));
  }
});
for (const [name, mutate] of [
  ['duplicate IDs', p => p[1].id = p[0].id],
  ['duplicate canonical project URLs', p => p[1].url = p[0].url + '#duplicate'],
  ['unknown purpose', p => p[0].category = 'reconstruction'],
  ['unknown type', p => p[0].kind = 'tooling'],
  ['unknown relationship', p => p[0].relationship = 'Definitely all built by REA'],
  ['attribute-like ID', p => p[0].id = 'bad" onclick="alert(1)'],
  ['CSS injection', p => p[0].tone = 'mint" onclick="alert(1)'],
  ['non-HTTPS evidence', p => p[0].evidence = 'javascript:alert(1)'],
  ['credential-bearing source', p => p[0].evidence = 'https://secret@example.com/'],
  ['private source', p => p[0].evidence = 'https://localhost/private'],
  ['malformed source URL', p => p[0].evidence = 'https://example.com/" onclick='],
  ['control character', p => p[0].summary = 'first\nsecond'],
  ['empty list description', p => p[0].listSummary = ' '],
  ['non-string list description', p => p[0].listSummary = null],
  ['multiline list description', p => p[0].listSummary = 'first\nsecond'],
  ['overlong list description', p => p[0].listSummary = 'x'.repeat(161)],
  ['missing limitation', p => p[0].limitation = ''],
  ['missing software license', p => p[0].licenseUrl = null],
  ['future check date', p => p[0].checked = '2999-01-01'],
  ['invalid date', p => p[0].checked = '2026-02-30'],
  ['unlabeled supporting link', p => { p[0].secondary = 'https://example.com/'; p[0].secondaryLabel = ''; }],
]) test(`rejects ${name}`, () => assert.throws(() => validateProjects(changed(mutate))));

test('README generation is deterministic, project-linked and preserves surrounding prose', () => {
  const original = 'Before\n<!-- catalog:start -->\nstale\n<!-- catalog:end -->\nAfter\n';
  const result = updateReadme(original, projects);
  assert(result.startsWith('Before\n') && result.endsWith('\nAfter\n'));
  assert.equal(updateReadme(result, projects), result);
  const plain = result.replace(/\\([\\`*_{}\[\]<>|])/g, '$1');
  for (const p of projects) { assert(result.includes(p.url)); assert(plain.includes(p.listSummary ?? p.summary)); }
  assert.equal(result.split('\n').filter(line => line.startsWith('- ')).length, projects.length);
  assert.equal(result.split('\n').filter(line => line.startsWith('### ')).length, populatedCategories(projects).length);
  assert(!/^[ \t]+- /m.test(result));
  assert(!result.includes('**Type:**') && !result.includes('**Limits:**'));
  assert.notEqual(updateReadme(result, changed(p => p[0].listSummary += ' Updated.')), result);
  assert.throws(() => updateReadme('no markers', projects));
  assert.throws(() => updateReadme(original + '<!-- catalog:start -->', projects));
});
test('covers are optional, local, attributed and validated against their actual files', () => {
  assert(covers['dx-ball'], 'The requested DX-Ball README cover must be present');
  assert.doesNotThrow(() => validateCovers({}, projects));
  assert.doesNotThrow(() => validateCovers(covers, projects));
});
for (const [name, mutate] of [
  ['unknown project', c => c['unknown-project'] = c['dx-ball']],
  ['remote image path', c => c['dx-ball'].src = 'https://example.com/track.webp'],
  ['path traversal', c => c['dx-ball'].src = '/covers/../private.webp'],
  ['invalid dimensions', c => c['dx-ball'].width = 0],
  ['unpinned provenance', c => c['dx-ball'].readme = 'https://github.com/N0zoM1z0/dx-ball/blob/main/README.md'],
  ['credential-bearing image source', c => c['dx-ball'].source = 'https://secret@raw.githubusercontent.com/image.png'],
  ['temporary signed image URL', c => c['dx-ball'].source += '?signature=temporary'],
  ['future cover review', c => c['dx-ball'].checked = '2999-01-01'],
]) test(`cover rejects ${name}`, () => {
  const copy = structuredClone(covers); mutate(copy);
  assert.throws(() => validateCovers(copy, projects));
});

test('README falls back to the full summary when no short description is provided', () => {
  const withoutShort = changed(p => { delete p[0].listSummary; });
  validateProjects(withoutShort);
  assert(renderCatalog(withoutShort).includes(withoutShort[0].summary));
});
test('README escapes Markdown syntax in both short and fallback descriptions', () => {
  for (const field of ['listSummary', 'summary']) {
    const rendered = renderCatalog(changed(p => {
      delete p[0].listSummary;
      p[0][field] = '[injected](https://example.com) <script> **bold**';
    }));
    assert(!rendered.includes('[injected](https://example.com)'));
    assert(!rendered.includes('<script>'));
    assert(rendered.includes('\\[injected\\]'));
  }
});
