import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { locales } from './i18n.mjs';
import { assertPolicySafe } from './catalog.mjs';

export const titleLimit = 60;
export const descriptionLimit = 155;
const fields = ['title', 'description', 'subtitle'];

// Optional per-locale search snippets keyed by project ID; kept outside projects.json so translation hashes stay stable.
export function validateSeo(seo, projects) {
  assert(seo && typeof seo === 'object' && !Array.isArray(seo), 'SEO override map must be an object');
  const ids = new Set(projects.map(p => p.id));
  for (const [id, byLocale] of Object.entries(seo)) {
    assert(ids.has(id), `${id}: SEO override for unknown project`);
    for (const [locale, entry] of Object.entries(byLocale)) {
      assert(Object.hasOwn(locales, locale), `${id}: unsupported SEO locale ${locale}`);
      assert(Object.keys(entry).every(key => fields.includes(key)), `${id}/${locale}: unknown SEO field`);
      for (const key of Object.keys(entry)) {
        assert(typeof entry[key] === 'string' && entry[key].trim(), `${id}/${locale}: empty ${key}`);
        assert(!/[<>\u0000-\u001f\u007f]/u.test(entry[key]), `${id}/${locale}: markup/control character in ${key}`);
        assertPolicySafe(`${id}/${locale}.${key}`, entry[key]);
      }
      if (entry.title) assert(entry.title.length <= titleLimit, `${id}/${locale}: title exceeds ${titleLimit} characters`);
      if (entry.description) assert(entry.description.length <= descriptionLimit, `${id}/${locale}: description exceeds ${descriptionLimit} characters`);
    }
  }
  return seo;
}

export async function loadSeo(projects) {
  return validateSeo(JSON.parse(await readFile(new URL('../src/project-seo.json', import.meta.url), 'utf8')), projects);
}
