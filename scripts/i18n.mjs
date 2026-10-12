import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { categories, kinds, relationships } from './catalog.mjs';

export const locales = {
  en: { lang: 'en', prefix: '/', label: 'English', readme: 'README.md', og: 'og.png', ogLocale: 'en_US' },
  'zh-CN': { lang: 'zh-CN', prefix: '/zh/', label: '简体中文', readme: 'README.zh-CN.md', og: 'og.zh-CN.png', ogLocale: 'zh_CN' },
};
export const displayFields = ['name', 'tag', 'target', 'summary', 'listSummary', 'evidenceScope', 'status', 'limitation', 'license', 'licenseNote', 'secondaryLabel'];
export const sourceHash = project => createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(project).sort(([a], [b]) => a.localeCompare(b, 'en'))))).digest('hex');
export const localePath = (locale, page = '') => {
  assert(Object.hasOwn(locales, locale), `Unsupported locale: ${locale}`);
  return locales[locale].prefix + page;
};
export function validateMessages(source, translated) {
  assert.deepEqual(Object.keys(translated).sort(), Object.keys(source).sort(), 'Locale message keys must match English exactly');
  for (const [key, value] of Object.entries(translated)) {
    assert(typeof value === 'string' && value.trim(), `Missing translation: ${key}`);
    assert(!/[<>\u0000-\u001f\u007f]/u.test(value), `Markup/control character in message: ${key}`);
    const tokens = text => [...text.matchAll(/\{([a-zA-Z]+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(tokens(value), tokens(source[key]), `Translation placeholders differ: ${key}`);
  }
  for (const key of Object.keys(categories)) assert(translated[`category.${key}`]);
  for (const key of Object.keys(kinds)) assert(translated[`kind.${key}`]);
  for (const key of relationships) assert(translated[`relationship.${key}`]);
  return translated;
}
export function validateTranslations(projects, translations, locale = 'zh-CN') {
  assert.deepEqual(Object.keys(translations).sort(), projects.map(p => p.id).sort(), 'Every project needs exactly one translation');
  for (const p of projects) {
    const translated = translations[p.id];
    const fields = displayFields.filter(key => Object.hasOwn(p, key));
    assert.deepEqual(Object.keys(translated).sort(), ['sourceHash', ...fields].sort(), `${p.id}: translation fields differ`);
    assert.equal(translated.sourceHash, sourceHash(p), `${p.id}: source changed; review translation before updating sourceHash`);
    for (const key of fields) {
      assert(typeof translated[key] === 'string' && translated[key].trim(), `${p.id}: missing translated ${key}`);
      assert(!/[<>\u0000-\u001f\u007f]/u.test(translated[key]), `${p.id}: markup/control character in ${key}`);
    }
    if (locale === 'zh-CN') for (const key of ['tag', 'summary', 'listSummary', 'evidenceScope', 'status', 'limitation', 'licenseNote', 'secondaryLabel'].filter(k => fields.includes(k))) {
      assert(/\p{Script=Han}/u.test(translated[key]), `${p.id}: ${key} must contain Chinese, not an English fallback`);
    }
    if (translated.listSummary) assert(translated.listSummary.length <= 160, `${p.id}: translated listSummary exceeds 160 characters`);
  }
  return translations;
}
export async function loadLocale(locale, projects) {
  assert(Object.hasOwn(locales, locale), `Unsupported locale: ${locale}`);
  const source = JSON.parse(await readFile(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
  const messages = locale === 'en' ? source : JSON.parse(await readFile(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8'));
  validateMessages(source, messages);
  if (locale === 'zh-CN') for (const [key, value] of Object.entries(messages)) assert(/\p{Script=Han}/u.test(value), `${key}: Chinese UI translation required`);
  let localized = projects;
  if (locale !== 'en') {
    const translations = validateTranslations(projects, JSON.parse(await readFile(new URL(`../src/locales/projects.${locale}.json`, import.meta.url), 'utf8')), locale);
    localized = projects.map(p => ({ ...p, ...Object.fromEntries(displayFields.filter(k => Object.hasOwn(p, k)).map(k => [k, translations[p.id][k]])) }));
  }
  const t = (key, values = {}) => {
    assert(Object.hasOwn(messages, key), `Unknown message: ${key}`);
    return messages[key].replace(/\{([a-zA-Z]+)\}/g, (_, token) => {
      assert(Object.hasOwn(values, token), `Missing ${token} for ${key}`);
      return String(values[token]);
    });
  };
  return { ...locales[locale], locale, messages, t, projects: localized };
}
