// Optional GA4: no Google code or requests before explicit consent.
(() => {
  'use strict';
  const ID = 'G-KFLGGK81K8';
  const KEY = 'awesomerea.analytics-consent.v1';
  const AGE = 180 * 24 * 60 * 60 * 1000;
  const panel = document.querySelector('#analytics-consent');
  const settings = document.querySelector('#analytics-settings');
  if (!panel || !settings) return;
  const accept = panel.querySelector('#analytics-accept');
  const reject = panel.querySelector('#analytics-reject');
  const status = panel.querySelector('#analytics-status');
  const production = location.origin === 'https://awesomerea.com';
  const paths = new Set(['/', '/zh/', '/method/', '/zh/method/']);
  const path = paths.has(location.pathname) ? location.pathname : (location.pathname.startsWith('/zh/') ? '/zh/404.html' : '/404.html');
  const pageLocation = location.origin + path;
  const adsDenied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  let saved = read();
  let pageOnly = false;
  let initialized = false;
  let loaded = false;
  let sent = false;
  let expiry;
  window['ga-disable-' + ID] = true;
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (value && value.version === 1 && ['accepted', 'rejected'].includes(value.choice)
        && Number.isFinite(value.at) && value.at <= Date.now() && Date.now() - value.at < AGE) return value;
    } catch { /* Unavailable or invalid storage never grants consent. */ }
    return null;
  }
  function signal() {
    return navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || navigator.globalPrivacyControl === true;
  }
  function allowed() {
    return production && saved?.choice === 'accepted' && saved.at <= Date.now()
      && Date.now() - saved.at < AGE && !signal();
  }
  function referrer() {
    try {
      const url = new URL(document.referrer);
      return url.origin === location.origin && paths.has(url.pathname) ? url.origin + url.pathname : url.origin;
    } catch { return ''; }
  }
  function clearCookies() {
    const names = document.cookie.split(';').map(c => c.trim().split('=')[0])
      .filter(name => name === '_ga' || name === '_ga_' + ID.slice(2));
    for (const name of names) for (const domain of ['', '; Domain=awesomerea.com', '; Domain=.awesomerea.com']) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
    }
  }
  function pageview() {
    if (!allowed() || !loaded || sent) return;
    sent = true;
    window.gtag('event', 'page_view', { page_location: pageLocation, page_referrer: referrer(), page_title: document.title });
  }
  function apply() {
    const enabled = allowed();
    window['ga-disable-' + ID] = !enabled;
    if (!enabled) {
      if (initialized) window.gtag('consent', 'update', { analytics_storage: 'denied', ...adsDenied });
      clearCookies();
    } else if (!initialized) {
      initialized = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'denied', ...adsDenied });
      window.gtag('consent', 'update', { analytics_storage: 'granted', ...adsDenied });
      window.gtag('js', new Date());
      window.gtag('config', ID, {
        send_page_view: false, page_location: pageLocation, page_referrer: referrer(), page_title: document.title,
        allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: 'awesomerea.com', cookie_path: '/', cookie_flags: 'SameSite=Lax;Secure',
        cookie_expires: AGE / 1000, cookie_update: false,
      });
      const script = document.createElement('script');
      script.id = 'awesomerea-ga'; script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
      script.addEventListener('load', () => { loaded = true; pageview(); }, { once: true });
      document.head.append(script);
    } else {
      window.gtag('consent', 'update', { analytics_storage: 'granted', ...adsDenied });
      pageview();
    }
    clearTimeout(expiry);
    if (saved) expiry = setTimeout(refresh, Math.min(Math.max(1, saved.at + AGE - Date.now()), 2147483647));
  }
  function render(open = false) {
    panel.hidden = !open && (saved !== null || signal());
    document.body.classList.toggle('analytics-open', !panel.hidden);
    accept.disabled = signal();
    status.textContent = signal() ? status.dataset.signal : (!production ? status.dataset.preview : '');
    settings.hidden = false;
    settings.textContent = allowed() ? settings.dataset.allowed : settings.dataset.off;
  }
  function choose(choice) {
    if (choice === 'accepted' && signal()) return;
    saved = { version: 1, choice, at: Date.now() };
    pageOnly = false;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { pageOnly = true; }
    apply(); render(); settings.focus({ preventScroll: true });
  }
  function refresh() {
    if (!pageOnly) saved = read();
    else if (saved && Date.now() - saved.at >= AGE) saved = null;
    apply(); render();
  }
  accept.addEventListener('click', () => choose('accepted'));
  reject.addEventListener('click', () => choose('rejected'));
  settings.addEventListener('click', () => { render(true); reject.focus({ preventScroll: true }); });
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { pageOnly = false; refresh(); }
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  apply(); render();
})();
