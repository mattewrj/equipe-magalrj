// Boundaries: IPP / Prefeitura do Rio. Source and download date: data/source.json.
// Extrusion is a visual highlight, not measured terrain elevation.
import { loadPlaces, placeAccuracy } from './places.js';
const neighborhoods = [
  { id: 'bento-ribeiro', code: '089', name: 'Bento Ribeiro' },
  { id: 'marechal-hermes', code: '090', name: 'Marechal Hermes' },
  { id: 'honorio-gurgel', code: '087', name: 'Honório Gurgel' },
  { id: 'oswaldo-cruz', code: '088', name: 'Oswaldo Cruz' },
  { id: 'madureira', code: '083', name: 'Madureira' },
  { id: 'campinho', code: '078', name: 'Campinho' },
];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const byId = new Map(neighborhoods.map(neighborhood => [neighborhood.id, neighborhood]));
const buttons = [...document.querySelectorAll('[data-neighborhood]')];
const loading = document.querySelector('#map-loading');
const fallback = document.querySelector('#map-fallback');
const mapContainer = document.querySelector('#map');
const viewButton = document.querySelector('#map-view');
let activeId = neighborhoods[0].id;
let map, data, bounds, ready = false, view3d = true, hoverTimer, attempt = 0;
const markers = new Map();
const placeMarkers = new Map();
let places = [], activePopup, popupPlace, fallbackProject;
let placeCategory = 'all';
const placesReady = loadPlaces().then(result => { places = result; }).catch(() => {
  const empty = document.getElementById('locations-empty');
  empty.hidden = false;
  empty.textContent = 'Não foi possível carregar os locais. Atualize a página para tentar novamente.';
});

function polygonRings(geometry) { return geometry.type === 'MultiPolygon' ? geometry.coordinates.flat(1) : geometry.coordinates; }
function centroid(ring) {
  // Shoelace centroid in this small geographic extent; coordinates remain WGS84.
  let area = 0, x = 0, y = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const cross = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    area += cross; x += (ring[i][0] + ring[i + 1][0]) * cross; y += (ring[i][1] + ring[i + 1][1]) * cross;
  }
  return area ? [x / (3 * area), y / (3 * area)] : ring[0];
}
function setActive(id, moveCamera = true) {
  const neighborhood = byId.get(id);
  if (!neighborhood) return;
  const changed = activeId !== id;
  if (changed && activePopup) { activePopup.remove(); activePopup = undefined; }
  activeId = id;
  document.dispatchEvent(new CustomEvent('neighborhood:change', { detail: { id, name: neighborhood.name } }));
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.neighborhood === id)));
  document.querySelector('#active-neighborhood').textContent = neighborhood.name;
  if (neighborhood.center) document.querySelector('#map-coordinates').textContent = `${Math.abs(neighborhood.center[1]).toFixed(4)}° S · ${Math.abs(neighborhood.center[0]).toFixed(4)}° W`;
  markers.forEach((element, markerId) => { element.classList.toggle('active', markerId === id); element.setAttribute('aria-pressed', String(markerId === id)); });
  document.querySelectorAll('#fallback-drawing path').forEach(path => { path.classList.toggle('active', path.dataset.id === id); path.setAttribute('aria-pressed', String(path.dataset.id === id)); });
  if (!ready || !map) return;
  map.setFilter('active-outline', ['==', ['get', 'id'], id]);
  map.setPaintProperty('neighborhood-volume', 'fill-extrusion-color', ['case', ['==', ['get', 'id'], id], '#ffd651', '#3585c7']);
  map.setPaintProperty('neighborhood-volume', 'fill-extrusion-height', ['case', ['==', ['get', 'id'], id], 90, 22]);
  if (moveCamera && neighborhood.center) map.easeTo({ center: neighborhood.center, zoom: 14.05, pitch: view3d ? 54 : 0, bearing: view3d ? -18 : 0, duration: reducedMotion.matches ? 0 : (changed ? 1050 : 650), padding: { top: 20, bottom: 95, left: 20, right: 20 } });
}
buttons.forEach(button => {
  button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !activePopup) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { if (!activePopup) setActive(button.dataset.neighborhood); }, 90); } });
  button.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
  button.addEventListener('focus', () => { clearTimeout(hoverTimer); setActive(button.dataset.neighborhood); });
  button.addEventListener('click', () => { clearTimeout(hoverTimer); setActive(button.dataset.neighborhood); });
});
function setControls(enabled) { document.querySelectorAll('.map-controls button, #map-view').forEach(button => { button.disabled = !enabled; }); }
setControls(false);

function drawFallback() {
  if (!data || document.querySelector('#fallback-drawing svg')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 600 290');
  svg.setAttribute('aria-label', 'Limites geográficos reais dos seis bairros. Selecione um bairro.');
  const [west, south] = bounds[0], [east, north] = bounds[1];
  const longitudeScale = Math.cos((south + north) / 2 * Math.PI / 180);
  const scale = Math.min(560 / ((east - west) * longitudeScale), 260 / (north - south));
  const offsetX = (600 - (east - west) * longitudeScale * scale) / 2;
  const offsetY = (290 - (north - south) * scale) / 2;
  fallbackProject = ([x, y]) => [offsetX + (x - west) * longitudeScale * scale, offsetY + (north - y) * scale];
  for (const feature of data.features) {
    const path = document.createElementNS(ns, 'path');
    const d = polygonRings(feature.geometry).map(ring => ring.map(([x, y], index) => `${index ? 'L' : 'M'}${(offsetX + (x - west) * longitudeScale * scale).toFixed(2)},${(offsetY + (north - y) * scale).toFixed(2)}`).join(' ') + ' Z').join(' ');
    path.setAttribute('d', d); path.setAttribute('fill-rule', 'evenodd'); path.dataset.id = feature.properties.id;
    path.setAttribute('role', 'button'); path.setAttribute('tabindex', '0'); path.setAttribute('aria-label', feature.properties.label);
    const title = document.createElementNS(ns, 'title'); title.textContent = feature.properties.label; path.append(title);
    path.addEventListener('pointerenter', () => setActive(feature.properties.id, false));
    path.addEventListener('click', () => setActive(feature.properties.id, false));
    path.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); setActive(feature.properties.id, false); } });
    svg.append(path);
  }
  document.querySelector('#fallback-drawing').append(svg);
  placesReady.then(drawFallbackPlaces);
  setActive(activeId, false);
}
function drawFallbackPlaces() {
  const svg = document.querySelector('#fallback-drawing svg');
  if (!svg || !fallbackProject) return;
  for (const place of places) {
    if (!place.coordinates || svg.querySelector(`[data-place="${place.id}"]`)) continue;
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const [x, y] = fallbackProject(place.coordinates);
    point.setAttribute('cx', x); point.setAttribute('cy', y); point.setAttribute('r', 7);
    point.classList.add('fallback-place', place.category); point.dataset.place = place.id;
    point.style.display = place.neighborhood !== activeId || (placeCategory !== 'all' && place.category !== placeCategory) ? 'none' : '';
    point.setAttribute('role', 'button'); point.setAttribute('tabindex', '0');
    point.setAttribute('aria-label', `${place.title} — ${place.statusLabel.toLowerCase()}`);
    point.addEventListener('click', () => showPlace(place));
    point.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); showPlace(place); } });
    svg.append(point);
  }
}
function showFallback(message) {
  ready = false;
  const previousMap = map;
  map = undefined;
  if (previousMap) previousMap.remove();
  markers.clear(); loading.hidden = true; fallback.hidden = false;
  placeMarkers.clear(); activePopup = undefined;
  document.querySelector('#map-fallback-message').textContent = message;
  setControls(false); drawFallback();
}
function loadLibrary() {
  if (window.maplibregl) return Promise.resolve();
  if (!document.querySelector('#maplibre-css')) { const css = document.createElement('link'); css.id = 'maplibre-css'; css.rel = 'stylesheet'; css.href = '/vendor/maplibre-gl.css'; document.head.append(css); }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = '/vendor/maplibre-gl.js';
    script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('Map library unavailable')); };
    document.head.append(script);
  });
}
function overview() {
  if (!ready) return;
  map.fitBounds(bounds, { padding: { top: 35, bottom: 130, left: 40, right: 40 }, pitch: view3d ? 45 : 0, bearing: view3d ? -12 : 0, duration: reducedMotion.matches ? 0 : 1000, maxZoom: 13.7 });
}
document.querySelector('#zoom-in').addEventListener('click', () => map?.zoomIn({ duration: reducedMotion.matches ? 0 : 300 }));
document.querySelector('#zoom-out').addEventListener('click', () => map?.zoomOut({ duration: reducedMotion.matches ? 0 : 300 }));
document.querySelector('#map-reset').addEventListener('click', overview);
function showPlace(place) {
  if (!place?.coordinates) return;
  setActive(place.neighborhood, false);
  if (!map || !ready) {
    drawFallbackPlaces();
    document.querySelectorAll('.fallback-place').forEach(point => point.classList.toggle('selected', point.dataset.place === place.id));
    document.querySelector('#map-fallback-message').textContent = `${place.title}. ${placeAccuracy(place)}`;
    document.dispatchEvent(new CustomEvent('places:selected', { detail: { id: place.id } }));
    return;
  }
  if (activePopup) activePopup.remove();
  const content = document.createElement('div');
  const status = document.createElement('p'); status.textContent = place.statusLabel;
  const heading = document.createElement('h4'); heading.textContent = place.title;
  const address = document.createElement('p'); address.textContent = place.address;
  const schedule = document.createElement('p'); schedule.textContent = place.schedule;
  const accuracy = document.createElement('p'); accuracy.className = 'popup-accuracy'; accuracy.textContent = placeAccuracy(place);
  content.append(status, heading, address, schedule, accuracy);
  if (place.publicSource) {
    const source = document.createElement('a'); source.href = place.publicSource; source.textContent = 'Consultar fonte do local ↗';
    source.target = '_blank'; source.rel = 'noopener noreferrer'; source.className = 'popup-source';
    content.append(source);
  }
  popupPlace = place;
  const mapHeight = mapContainer.clientHeight;
  const popup = new window.maplibregl.Popup({ anchor: 'bottom', offset: 24, maxWidth: '290px', closeOnClick: false, focusAfterOpen: false }).setLngLat(place.coordinates).setDOMContent(content).addTo(map);
  activePopup = popup;
  const popupContent = popup.getElement().querySelector('.maplibregl-popup-content');
  popupContent.style.maxHeight = `${Math.floor(mapHeight * .72)}px`;
  popupContent.style.overflowY = 'auto';
  popup.on('close', () => { if (activePopup === popup) { activePopup = undefined; popupPlace = undefined; } });
  map.easeTo({ center: place.coordinates, zoom: 15.8, pitch: view3d ? 52 : 0, duration: reducedMotion.matches ? 0 : 900, padding: { top: mapHeight * .72, bottom: mapHeight * .04, left: 20, right: 20 } });
  document.dispatchEvent(new CustomEvent('places:selected', { detail: { id: place.id } }));
}
document.addEventListener('places:select', event => {
  showPlace(places.find(place => place.id === event.detail.id));
  document.querySelector('.map-card').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
});
document.addEventListener('places:filter', event => {
  placeCategory = event.detail.category;
  for (const place of places) {
    const marker = placeMarkers.get(place.id);
    if (marker) marker.getElement().hidden = place.neighborhood !== activeId || (placeCategory !== 'all' && place.category !== placeCategory);
    const fallbackPoint = document.querySelector(`[data-place="${place.id}"]`);
    if (fallbackPoint) fallbackPoint.style.display = place.neighborhood !== activeId || (placeCategory !== 'all' && place.category !== placeCategory) ? 'none' : '';
  }
  if (activePopup && popupPlace && (popupPlace.neighborhood !== activeId || (placeCategory !== 'all' && popupPlace.category !== placeCategory))) { activePopup.remove(); activePopup = undefined; }
});
function addPlaceMarkers() {
  if (!ready || !map) return;
  for (const place of places) {
    if (!place.coordinates || placeMarkers.has(place.id)) continue;
    const button = document.createElement('button'); button.className = `place-pin ${place.category}`;
    button.textContent = place.category === 'reference' ? '◇' : place.status === 'past' ? '◷' : '⌖';
    button.setAttribute('aria-label', `${place.title} — ${place.statusLabel.toLowerCase()}`);
    button.title = `${place.title}. ${placeAccuracy(place)}`;
    button.hidden = place.neighborhood !== activeId || (placeCategory !== 'all' && place.category !== placeCategory);
    button.addEventListener('click', event => { event.stopPropagation(); showPlace(place); });
    const marker = new window.maplibregl.Marker({ element: button, anchor: 'center' }).setLngLat(place.coordinates).addTo(map);
    placeMarkers.set(place.id, marker);
  }
}
viewButton.addEventListener('click', () => {
  if (!ready) return;
  view3d = !view3d;
  viewButton.innerHTML = `${view3d ? '3D' : '2D'} <span aria-hidden="true">◈</span>`;
  viewButton.setAttribute('aria-pressed', String(view3d));
  viewButton.setAttribute('aria-label', `Mudar para mapa em ${view3d ? '2D' : '3D'}`);
  map.easeTo({ pitch: view3d ? 54 : 0, bearing: view3d ? -18 : 0, duration: reducedMotion.matches ? 0 : 800 });
  map.setLayoutProperty('neighborhood-volume', 'visibility', view3d ? 'visible' : 'none');
  if (map.getLayer('buildings-3d')) map.setLayoutProperty('buildings-3d', 'visibility', view3d ? 'visible' : 'none');
});

async function initialize() {
  const currentAttempt = ++attempt;
  loading.hidden = false; fallback.hidden = true;
  document.querySelector('#map-loading p').textContent = 'Preparando seu passeio pelos bairros…';
  let timeout;
  try {
    if (!data) {
      const response = await fetch('/data/bairros.geojson');
      if (!response.ok) throw new Error('Boundary data unavailable');
      data = await response.json();
      if (data.features?.length !== 6) throw new Error('Invalid geographic data');
      const points = [];
      for (const feature of data.features) {
        const neighborhood = neighborhoods.find(item => item.code === feature.properties.codbairro);
        if (!neighborhood) throw new Error('Unknown neighborhood');
        feature.properties.id = neighborhood.id; feature.properties.label = neighborhood.name;
        neighborhood.center = centroid(polygonRings(feature.geometry)[0]);
        points.push(...polygonRings(feature.geometry).flat());
      }
      bounds = [[Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1]))], [Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]];
      drawFallback();
    }
    // Tiles and street/building geometry are real OpenStreetMap data via OpenFreeMap.
    const [, styleResponse] = await Promise.all([loadLibrary(), fetch('https://tiles.openfreemap.org/styles/dark', { signal: AbortSignal.timeout(15000) })]);
    if (!styleResponse.ok) throw new Error('Basemap unavailable');
    const style = await styleResponse.json();
    for (const layer of style.layers) {
      if (layer.type === 'background') layer.paint['background-color'] = '#122641';
      if (layer.type === 'fill' && /water/.test(layer.id)) layer.paint['fill-color'] = '#0b314d';
      // Keep roads and labels legible against the custom green cartographic palette.
      if (layer.paint?.['fill-pattern']) delete layer.paint['fill-pattern'];
      if (layer.type === 'line' && layer['source-layer'] === 'transportation') layer.paint['line-color'] = /casing|tunnel/.test(layer.id) ? '#0b1d35' : '#7393b4';
      if (layer.type === 'fill' && layer['source-layer'] === 'building') layer.paint['fill-color'] = '#28466a';
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        layer.paint = { ...layer.paint, 'text-color': '#b9d2eb', 'text-halo-color': '#10223c', 'text-halo-width': 1 };
      }
    }
    const initialCenter = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
    map = new window.maplibregl.Map({ container: mapContainer, style, center: initialCenter, zoom: 12.6, pitch: view3d ? 45 : 0, bearing: view3d ? -12 : 0, minZoom: 10, maxZoom: 18, attributionControl: false, dragRotate: true, maxPitch: 65 });
    map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.scrollZoom.disable();
    map.touchZoomRotate.disableRotation();
    map.getCanvas().setAttribute('aria-label', 'Mapa dos bairros. Use as setas para mover e os botões para aproximar.');
    timeout = setTimeout(() => { if (!ready && attempt === currentAttempt) showFallback('O mapa 3D está indisponível. Explore os limites reais em 2D.'); }, 20000);
    map.on('load', () => {
      if (attempt !== currentAttempt || !map) return;
      clearTimeout(timeout);
      try {
        const firstLabel = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
        const buildingSource = map.getStyle().layers.find(layer => layer['source-layer'] === 'building')?.source;
        if (buildingSource) map.addLayer({ id: 'buildings-3d', source: buildingSource, 'source-layer': 'building', type: 'fill-extrusion', minzoom: 13.5, paint: { 'fill-extrusion-color': '#486e94', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': .7 } }, firstLabel);
        map.addSource('neighborhoods', { type: 'geojson', data });
        map.addLayer({ id: 'neighborhood-fill', type: 'fill', source: 'neighborhoods', paint: { 'fill-color': '#82c4ff', 'fill-opacity': .12 } }, firstLabel);
        map.addLayer({ id: 'neighborhood-volume', type: 'fill-extrusion', source: 'neighborhoods', layout: { visibility: view3d ? 'visible' : 'none' }, paint: { 'fill-extrusion-color': '#368dc7', 'fill-extrusion-height': 22, 'fill-extrusion-base': 0, 'fill-extrusion-opacity': .28, 'fill-extrusion-height-transition': { duration: reducedMotion.matches ? 0 : 400 } } }, firstLabel);
        map.addLayer({ id: 'neighborhood-outline', type: 'line', source: 'neighborhoods', paint: { 'line-color': '#78b0eb', 'line-width': 1, 'line-opacity': .65 } });
        map.addLayer({ id: 'active-outline', type: 'line', source: 'neighborhoods', filter: ['==', ['get', 'id'], activeId], paint: { 'line-color': '#ffda48', 'line-width': 2.5 } });
        for (const neighborhood of neighborhoods) {
          const element = document.createElement('button'); element.className = 'map-marker'; element.textContent = neighborhood.name; element.setAttribute('aria-label', `Destacar ${neighborhood.name}`);
          element.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && !activePopup) setActive(neighborhood.id, false); });
          element.addEventListener('click', () => setActive(neighborhood.id));
          element.addEventListener('focus', () => setActive(neighborhood.id, false));
          new window.maplibregl.Marker({ element, anchor: 'center' }).setLngLat(neighborhood.center).addTo(map);
          markers.set(neighborhood.id, element);
        }
        map.on('mousemove', 'neighborhood-fill', event => { map.getCanvas().style.cursor = 'pointer'; const id = event.features?.[0]?.properties.id; if (!activePopup && id && id !== activeId) setActive(id, false); });
        map.on('mouseleave', 'neighborhood-fill', () => { map.getCanvas().style.cursor = ''; });
        map.on('click', 'neighborhood-fill', event => { const id = event.features?.[0]?.properties.id; if (id) setActive(id); });
        map.getCanvas().addEventListener('webglcontextlost', () => showFallback('A visualização 3D foi interrompida. Explore os limites reais em 2D.'), { once: true });
        ready = true; loading.hidden = true; setControls(true); setActive(activeId);
        placesReady.then(addPlaceMarkers);
      } catch { showFallback('Não foi possível iniciar o 3D. Explore os limites reais em 2D.'); }
    });
  } catch {
    clearTimeout(timeout);
    showFallback(data ? 'O mapa 3D está indisponível. Explore os limites reais em 2D.' : 'Não foi possível carregar o mapa. Tente novamente.');
  }
}
document.querySelector('#retry-map').addEventListener('click', initialize);
initialize();

