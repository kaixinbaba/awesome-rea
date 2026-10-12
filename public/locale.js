// Language is explicit in the URL; no storage, cookies or automatic redirects.
function updateLanguageLinks() {
  for (const link of document.querySelectorAll('[data-language]')) {
    const target = new URL(link.href);
    target.search = location.search;
    target.hash = location.hash;
    link.href = target.href;
  }
}
updateLanguageLinks();
window.addEventListener('hashchange', updateLanguageLinks);
window.addEventListener('pageshow', updateLanguageLinks);
