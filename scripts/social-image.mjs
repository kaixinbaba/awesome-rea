import { chromium } from 'playwright';
import { locales, loadLocale } from './i18n.mjs';
import { loadProjects } from './catalog.mjs';
const projects = await loadProjects();
const esc = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of Object.keys(locales)) {
    const { t, lang, og } = await loadLocale(locale, projects);
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<html lang="${lang}"><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f6f7f4;color:#192923;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;padding:65px 76px}header{font-size:29px;font-weight:700;letter-spacing:-1.4px}header span{color:#c4442d}small{font:13px monospace;letter-spacing:2px;display:block;margin-top:60px;color:#455b4e}h1{font-size:82px;line-height:1.06;letter-spacing:-4px;margin:25px 0}h1 span{color:#c4442d}p{font-size:23px;color:#5d6962;line-height:1.5;margin-top:29px}footer{font:13px monospace;position:absolute;bottom:53px;border-top:1px solid #dce2da;width:1048px;padding-top:24px;color:#455b4e}.mark{position:absolute;right:77px;top:75px;background:#192923;color:#c4f3b7;border-radius:15px;font:55px monospace;width:110px;height:110px;display:grid;place-items:center}html:lang(zh-CN) h1{letter-spacing:0;line-height:1.15}</style></head><body><header><span>&lt;/&gt;</span> awesomerea<span>.</span></header><div class="mark">↗</div><small>${esc(t('social.eyebrow'))}</small><h1>${esc(t('hero.title1'))}<br><span>${esc(t('hero.title2'))}</span></h1><p>${esc(t('social.line1'))}<br>${esc(t('social.line2'))}</p><footer>${esc(t('social.footer'))}</footer></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/${og}` });
    console.log(`Created public/${og} (1200 × 630)`);
    await page.close();
  }
} finally { await browser.close(); }
