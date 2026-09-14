import { mkdir, writeFile } from 'node:fs/promises';
// The official dataset spells neighborhood 088 as "Osvaldo Cruz".
// The interface uses the user's spelling "Oswaldo Cruz"; the geometry is unchanged.
const names = ['Bento Ribeiro', 'Marechal Hermes', 'Honório Gurgel', 'Osvaldo Cruz', 'Madureira', 'Campinho'];
const base = 'https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Cartografia/Limites_administrativos/FeatureServer/4/query';
const params = new URLSearchParams({ where: `nome IN (${names.map(name => `'${name}'`).join(',')})`, outFields: 'nome,codbairro,regiao_adm', outSR: '4326', f: 'geojson', geometryPrecision: '6' });
const response = await fetch(`${base}?${params}`, { signal: AbortSignal.timeout(45000) });
if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
const data = await response.json();
if (data.features?.length !== 6) throw new Error(`Expected six neighborhoods: ${JSON.stringify(data).slice(0,500)}`);
for (const feature of data.features) if (!names.includes(feature.properties.nome)) throw new Error('Unexpected neighborhood');
await mkdir('dist/data', { recursive: true });
await writeFile('dist/data/bairros.geojson', JSON.stringify(data));
await writeFile('dist/data/source.json', JSON.stringify({ name: 'Limite de Bairros — Instituto Pereira Passos / Prefeitura da Cidade do Rio de Janeiro', source: base.replace('/query', ''), downloaded: new Date().toISOString(), crs: 'EPSG:4326', note: 'Geometrias oficiais. Extrusão no mapa é destaque visual, não representa elevação do terreno.' }, null, 2));
await mkdir('dist/vendor', { recursive: true });
for (const file of ['maplibre-gl.js', 'maplibre-gl.css']) {
  const result = await fetch(`https://unpkg.com/maplibre-gl@5.6.0/dist/${file}`, { signal: AbortSignal.timeout(45000) });
  if (!result.ok) throw new Error(`MapLibre HTTP ${result.status}`);
  await writeFile(`dist/vendor/${file}`, Buffer.from(await result.arrayBuffer()));
}
console.log(data.features.map(feature => ({ name: feature.properties.nome, type: feature.geometry.type, coordinates: feature.geometry.coordinates.flat(2).slice(0,4) })));
