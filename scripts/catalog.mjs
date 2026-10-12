import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

export const categories = {
  'dev-tools': 'Developer & security tools',
  games: 'Games & game engines',
  apps: 'Desktop & productivity apps',
  hardware: 'Audio, hardware & drivers',
  integrations: 'REA plugins, integrations & packaging',
  learning: 'Tutorials, case studies & resources',
};
export const kinds = {
  tool: 'Analysis tool', reconstruction: 'Reconstruction', interoperability: 'Interoperability',
  integration: 'Integration / packaging', analysis: 'Case study', resource: 'Learning resource',
};
export const relationships = ['Upstream REA project', 'Author documents REA use', 'REA maintainer case study', 'REA tooling present', 'REA integration / packaging', 'REA learning resource'];
export const repository = 'https://github.com/kaixinbaba/awesome-rea';
export const issueLinks = {
  suggest: `${repository}/issues/new?template=1-project.yml`,
  correction: `${repository}/issues/new?template=2-correction.yml`,
  bug: `${repository}/issues/new?template=3-website.yml`,
};
export function validateProjects(projects) {
  assert(Array.isArray(projects) && projects.length, 'Catalog must be a nonempty array');
  const ids = new Set(), urls = new Set();
  for (const p of projects) {
    for (const key of ['id','name','initial','category','kind','tag','tone','target','summary','relationship','evidenceScope','status','limitation','license','url','evidence','checked']) {
      assert(typeof p[key] === 'string' && p[key].trim(), `${p.id || 'entry'}: missing ${key}`);
      assert(!/[\u0000-\u001f\u007f]/u.test(p[key]), `${p.id}: control character in ${key}`);
    }
    if (Object.hasOwn(p, 'listSummary')) {
      assert(typeof p.listSummary === 'string' && p.listSummary.trim() && p.listSummary.length <= 160, `${p.id}: listSummary must be 1–160 characters`);
      assert(!/[\u0000-\u001f\u007f]/u.test(p.listSummary), `${p.id}: control character in listSummary`);
    }
    assert(/^[a-z][a-z0-9-]*$/.test(p.id) && !ids.has(p.id), `Invalid/duplicate ID: ${p.id}`); ids.add(p.id);
    assert(Object.hasOwn(categories, p.category), `${p.id}: unknown category`);
    assert(Object.hasOwn(kinds, p.kind), `${p.id}: unknown kind`);
    assert(relationships.includes(p.relationship), `${p.id}: unknown REA relationship`);
    assert(['mint','peach','lavender','sand'].includes(p.tone), `${p.id}: invalid tone`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(p.checked) && new Date(p.checked).toISOString().slice(0,10) === p.checked, `${p.id}: invalid date`);
    assert(p.checked <= new Date().toISOString().slice(0,10), `${p.id}: future source-review date`);
    for (const key of ['url','evidence','secondary','licenseUrl']) if (p[key]) {
      const u = new URL(p[key]);
      assert(u.protocol === 'https:' && !u.username && !u.password, `${p.id}: unsafe ${key}`);
      assert(!/[\s<>"'`\\]/.test(p[key]), `${p.id}: malformed ${key}`);
      assert(!/^(localhost|127\.|0\.|\[|.*\.local$)/.test(u.hostname), `${p.id}: nonpublic ${key}`);
    }
    const normalized = new URL(p.url); normalized.hash = '';
    assert(!urls.has(normalized.href), `${p.id}: duplicate project URL`); urls.add(normalized.href);
    assert(!p.secondary || p.secondaryLabel, `${p.id}: secondary link needs a label`);
    assert(p.licenseUrl === null || typeof p.licenseUrl === 'string', `${p.id}: explicit license URL or null required`);
    if (!p.licenseUrl) assert(p.kind === 'analysis' || p.kind === 'resource', `${p.id}: software entries require a license source`);
  }
  return projects;
}
export async function loadProjects() { return validateProjects(JSON.parse(await readFile(new URL('../src/projects.json', import.meta.url), 'utf8'))); }
export function populatedCategories(projects) { return Object.entries(categories).filter(([key]) => projects.some(p => p.category === key)); }
