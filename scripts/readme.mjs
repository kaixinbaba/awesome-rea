import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadProjects, populatedCategories } from './catalog.mjs';
import { locales, loadLocale } from './i18n.mjs';
const { t: english } = await loadLocale('en', []);
const start = '<!-- catalog:start -->', end = '<!-- catalog:end -->';
const md = value => String(value).replace(/[\\`*_{}\[\]<>|]/g, '\\$&');
const link = (url, label) => `[${md(label)}](<${url}>)`;
export function renderCatalog(projects, t = english) {
  const groups = populatedCategories(projects);
  const lines = ['<!-- Generated from src/projects.json and src/locales by npm run readme. -->', '', t('readme.count', { total: projects.length, groups: groups.length }), ''];
  for (const [key] of groups) {
    lines.push(`### ${t(`category.${key}`)}`, '');
    for (const p of projects.filter(p => p.category === key)) {
      lines.push(`- ${link(p.url, p.name)} — ${md(p.listSummary ?? p.summary)}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
export function updateReadme(readme, projects, t = english) {
  if (readme.split(start).length !== 2 || readme.split(end).length !== 2 || readme.indexOf(end) < readme.indexOf(start)) throw new Error('README must have exactly one ordered catalog marker pair');
  return readme.slice(0, readme.indexOf(start) + start.length) + '\n' + renderCatalog(projects, t) + '\n' + readme.slice(readme.indexOf(end));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = await loadProjects();
  for (const locale of Object.keys(locales)) {
    const { readme, projects, t } = await loadLocale(locale, source);
    const current = await readFile(readme, 'utf8');
    const next = updateReadme(current, projects, t);
    if (process.argv.includes('--write')) { await writeFile(readme, next); console.log(`${readme} generated from the shared catalog and translations`); }
    else if (next !== current) { console.error(`${readme} is stale. Run npm run readme and commit both READMEs with the data and translations.`); process.exitCode = 1; }
    else console.log(`PASS: ${readme} matches catalog and translations`);
  }
}
