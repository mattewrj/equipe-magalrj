import { mkdir, writeFile } from 'node:fs/promises';
const root = 'https://raw.githubusercontent.com/DavidHDev/react-bits/main/';
const files = [
  ['src/content/Backgrounds/LightRays/LightRays.jsx', 'src/react-bits/LightRays.jsx'],
  ['src/content/Backgrounds/LightRays/LightRays.css', 'src/react-bits/LightRays.css'],
  ['src/content/Animations/StarBorder/StarBorder.jsx', 'src/react-bits/StarBorder.jsx'],
  ['src/content/Animations/StarBorder/StarBorder.css', 'src/react-bits/StarBorder.css'],
  ['LICENSE.md', 'src/react-bits/LICENSE.md'],
];
await mkdir('src/react-bits', { recursive: true });
for (const [source, destination] of files) {
  const response = await fetch(root + source, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${source}: ${response.status}`);
  await writeFile(destination, await response.text());
  console.log(destination);
}
