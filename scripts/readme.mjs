import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadProjects, kinds, populatedCategories } from './catalog.mjs';
const start = '<!-- catalog:start -->', end = '<!-- catalog:end -->';
const md = value => String(value).replace(/[\\`*_{}\[\]<>|]/g, '\\$&');
const link = (url, label) => `[${md(label)}](<${url}>)`;
export function renderCatalog(projects) {
  const groups = populatedCategories(projects);
  const checked = projects.map(p => p.checked).sort().at(-1);
  const lines = ['<!-- Generated from src/projects.json by npm run readme. -->', '', `**${projects.length} entries · ${groups.length} populated purpose groups · latest source review: ${checked}**`, ''];
  for (const [key, title] of groups) {
    lines.push(`### ${title}`, '');
    for (const p of projects.filter(p => p.category === key)) {
      lines.push(`- **${link(p.url, p.name)}** — ${md(p.summary)}`,
        `  - **Type:** ${md(kinds[p.kind])}. **Status:** ${md(p.status)}. **License:** ${p.licenseUrl ? link(p.licenseUrl, p.license) : md(p.license)}.`,
        `  - **REA:** ${md(p.relationship)} — ${link(p.evidence, 'primary evidence')} (checked ${p.checked}). ${md(p.evidenceScope)}`,
        `  - **Limits:** ${md(p.limitation)}${p.licenseNote ? ' ' + md(p.licenseNote) : ''}${p.secondary ? ' ' + link(p.secondary, p.secondaryLabel) + '.' : ''}`, '');
    }
  }
  return lines.join('\n').trimEnd();
}
export function updateReadme(readme, projects) {
  if (readme.split(start).length !== 2 || readme.split(end).length !== 2 || readme.indexOf(end) < readme.indexOf(start)) throw new Error('README must have exactly one ordered catalog marker pair');
  return readme.slice(0, readme.indexOf(start) + start.length) + '\n' + renderCatalog(projects) + '\n' + readme.slice(readme.indexOf(end));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const current = await readFile('README.md', 'utf8');
  const next = updateReadme(current, await loadProjects());
  if (process.argv.includes('--write')) { await writeFile('README.md', next); console.log('README directory generated from src/projects.json'); }
  else if (next !== current) { console.error('README catalog is stale. Run npm run readme and commit README.md with the data.'); process.exitCode = 1; }
  else console.log('PASS: README catalog matches src/projects.json');
}
