import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadProjects, populatedCategories } from './catalog.mjs';
const start = '<!-- catalog:start -->', end = '<!-- catalog:end -->';
const md = value => String(value).replace(/[\\`*_{}\[\]<>|]/g, '\\$&');
const link = (url, label) => `[${md(label)}](<${url}>)`;
export function renderCatalog(projects) {
  const groups = populatedCategories(projects);
  const lines = ['<!-- Generated from src/projects.json by npm run readme. -->', '', `${projects.length} projects & resources · ${groups.length} categories`, ''];
  for (const [key, title] of groups) {
    lines.push(`### ${title}`, '');
    for (const p of projects.filter(p => p.category === key)) {
      lines.push(`- ${link(p.url, p.name)} — ${md(p.listSummary ?? p.summary)}`);
    }
    lines.push('');
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
