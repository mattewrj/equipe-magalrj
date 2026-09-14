import { loadPlaces } from './places.js';
import { initMusic } from './music.js';

initMusic();

// Populate the small location list before navigation to sections below the map.
// The 3D map itself still loads only near the viewport.
const placesContentReady = loadPlaces().catch(() => {});
document.querySelector('#year').textContent = new Date().getFullYear();
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-nav');
function closeMenu() { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menu'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; mobileMenu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuButton.focus(); } });
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.documentElement.classList.add('js-ready');
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }), { threshold: .05 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
const mapObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { mapObserver.disconnect(); import('./map.js').catch(() => { document.querySelector('#map-loading p').textContent = 'Não foi possível carregar o mapa. Atualize a página para tentar novamente.'; document.querySelector('.loading-orbit').hidden = true; }); } }, { rootMargin: '250px' });
mapObserver.observe(document.querySelector('#mapa'));

const supportSection = document.getElementById('apoio');
const gallerySection = document.getElementById('galeria');
const lowerSections = [
  { hash: '#apoio', section: supportSection, heading: 'support-heading' },
  { hash: '#galeria', section: gallerySection, heading: 'gallery-heading' },
].filter(item => item.section);
const initialSection = lowerSections.find(item => item.hash === location.hash);
if (initialSection) {
  let manuallyNavigated = false;
  const anchorListeners = new AbortController();
  const markManualNavigation = () => { manuallyNavigated = true; };
  for (const type of ['wheel', 'touchmove', 'keydown', 'pointerdown']) {
    window.addEventListener(type, markManualNavigation, { passive: true, signal: anchorListeners.signal });
  }
  Promise.all([placesContentReady, document.fonts?.ready]).then(() => {
    if (location.hash === initialSection.hash && !manuallyNavigated) initialSection.section.scrollIntoView({ behavior: 'instant', block: 'start' });
    anchorListeners.abort();
  });
}
for (const { hash, section, heading } of lowerSections) {
  document.querySelectorAll(`a[href="${hash}"]`).forEach(link => link.addEventListener('click', async event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await placesContentReady;
    if (location.hash !== hash) history.pushState(null, '', hash);
    section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    document.getElementById(heading)?.focus({ preventScroll: true });
  }));
}
// The support link is static; the decorative canvas loads as its section approaches.
if (supportSection) {
  const supportObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    supportObserver.disconnect();
    import('./support-effect.js').then(({ initSupportEffect }) => {
      const dispose = initSupportEffect(supportSection);
      window.addEventListener('pagehide', event => { if (!event.persisted) dispose?.(); }, { once: true });
    }).catch(() => {});
  }, { rootMargin: '250px' });
  supportObserver.observe(supportSection);
}
if (gallerySection) {
  const galleryObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    galleryObserver.disconnect();
    import('./gallery.js').then(({ initGallery }) => {
      const dispose = initGallery(gallerySection);
      window.addEventListener('pagehide', event => { if (!event.persisted) dispose?.(); }, { once: true });
    }).catch(() => {
      const message = gallerySection.querySelector('[data-gallery-loading]');
      message.textContent = 'Não foi possível carregar a galeria. Atualize a página para tentar novamente.';
      gallerySection.querySelectorAll('.gallery-controls button').forEach(button => { button.disabled = true; });
    });
  }, { rootMargin: '300px' });
  galleryObserver.observe(gallerySection);
}
// Decorative React Bits islands load after primary content. The static links remain usable.
const loadEffects = () => import('./effects.js').catch(() => {});
if ('requestIdleCallback' in window) requestIdleCallback(loadEffects, { timeout: 1500 });
else setTimeout(loadEffects, 400);
document.querySelectorAll('.proposal-card').forEach(card => {
  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  });
});
