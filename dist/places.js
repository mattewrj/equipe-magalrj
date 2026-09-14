const list = document.getElementById('location-list');
const empty = document.getElementById('locations-empty');
const title = document.getElementById('places-neighborhood');
const filters = [...document.querySelectorAll('[data-place-filter]')];
let locations = [], category = 'all', neighborhood = { id: 'bento-ribeiro', name: 'Bento Ribeiro' };
let activePlace = null;
let loadingPromise;

export function placeAccuracy(place) {
  return place.accuracyNote || 'Referência aproximada da rua; confirme o número antes de ir.';
}

function render() {
  title.textContent = neighborhood.name;
  const items = locations.filter(place => place.neighborhood === neighborhood.id && (category === 'all' || place.category === category));
  list.replaceChildren();
  empty.hidden = items.length > 0;
  if (!items.length) {
    const messages = {
      materials: `Ainda não há endereço e horário de retirada de materiais informados em ${neighborhood.name}.`,
      meeting: `Ainda não há encontros publicados em ${neighborhood.name}.`,
      reference: `Ainda não há referências locais identificadas em ${neighborhood.name}.`,
      all: `Ainda não há pontos publicados em ${neighborhood.name}.`,
    };
    empty.textContent = messages[category];
  }
  for (const place of items) {
    const card = document.createElement('article'); card.className = 'place-card'; card.dataset.placeId = place.id;
    card.classList.toggle('active', place.id === activePlace);
    card.classList.add(`place-card-${place.category}`);
    const status = document.createElement('span'); status.className = 'place-type'; status.textContent = `${place.category === 'reference' ? '◇' : place.status === 'past' ? '◷' : '⌖'} ${place.statusLabel}`;
    const heading = document.createElement('h4'); heading.textContent = place.title;
    const address = document.createElement('p'); address.textContent = place.address;
    const schedule = document.createElement('p'); schedule.className = 'place-availability'; schedule.textContent = place.schedule;
    const description = document.createElement('p'); description.textContent = place.description;
    card.append(status, heading, address, schedule, description);
    if (place.coordinates) {
      const button = document.createElement('button'); button.className = 'place-link'; button.textContent = 'Ver no mapa ↗';
      button.setAttribute('aria-label', `Ver ${place.title} no mapa`);
      button.addEventListener('click', () => { activePlace = place.id; render(); document.dispatchEvent(new CustomEvent('places:select', { detail: { id: place.id } })); });
      card.append(button);
    }
    list.append(card);
  }
  document.dispatchEvent(new CustomEvent('places:filter', { detail: { category, neighborhood: neighborhood.id } }));
}
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.placeFilter;
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  render();
}));
document.addEventListener('neighborhood:change', event => { neighborhood = event.detail; render(); });
document.addEventListener('places:selected', event => { activePlace = event.detail.id; render(); });
export function loadPlaces() {
  if (!loadingPromise) loadingPromise = (async () => {
    const response = await fetch('/data/locations.json');
    if (!response.ok) throw new Error('Location data unavailable');
    const data = await response.json();
    locations = data.locations;
    render();
    return locations;
  })().catch(error => { loadingPromise = undefined; throw error; });
  return loadingPromise;
}
render();
