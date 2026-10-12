const cards = [...document.querySelectorAll('.project-card')];
const tools = document.querySelector('.directory-tools');
const search = document.querySelector('#search');
const kind = document.querySelector('#kind-filter');
const filters = [...document.querySelectorAll('[data-filter]')];
const count = document.querySelector('#result-count');
const empty = document.querySelector('#empty-results');
let category = 'all';
const haystacks = cards.map(card => card.textContent.normalize('NFKC').toLowerCase());

function render() {
  const words = search.value.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  cards.forEach((card, i) => {
    const matches = (category === 'all' || card.dataset.category === category) && (kind.value === 'all' || card.dataset.kind === kind.value) && words.every(word => haystacks[i].includes(word));
    card.hidden = !matches;
    if (matches) visible++;
  });
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  count.textContent = count.dataset.template.replace('{visible}', String(visible)).replace('{total}', String(cards.length));
  empty.hidden = visible !== 0;
}
search.addEventListener('input', render);
kind.addEventListener('change', render);
filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; render(); }));
document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; category = 'all'; kind.value = 'all'; render(); search.focus(); });
tools.hidden = false;

// A bookmarked entry should not stay hidden behind a previous filter.
function revealHash() {
  const card = cards.find(item => `#${item.id}` === location.hash);
  if (!card) return;
  search.value = ''; category = 'all'; kind.value = 'all'; render();
  if (location.hash) card.scrollIntoView({ block: 'start', behavior: 'instant' });
}
window.addEventListener('hashchange', revealHash);
window.addEventListener('pageshow', () => { render(); revealHash(); });

const copy = document.querySelector('#copy-command');
const feedback = document.querySelector('#copy-status');
if (navigator.clipboard?.writeText && window.isSecureContext) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('npx rea-agents setup');
      feedback.textContent = feedback.dataset.success;
    } catch {
      feedback.textContent = feedback.dataset.failure;
    }
  });
}
