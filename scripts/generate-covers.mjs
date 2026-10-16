#!/usr/bin/env node
/** Editorial SVG→WebP covers for projects without upstream README images.
 *  GenerateImage (GPT) unavailable in this executor environment; local SVG fallback authorized to avoid dry pages.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { loadProjects } from './catalog.mjs';
import sharp from 'sharp';

const CWEBP = process.env.CWEBP || '/tmp/webp-root/usr/bin/cwebp';
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();
const tones = {
  mint: ['#1d3026', '#286b52', '#90b583', '#e0efde'],
  peach: ['#3a241c', '#843f26', '#d4a086', '#f6e4d9'],
  lavender: ['#2a2438', '#5e4985', '#b5a5d4', '#ece7f6'],
  sand: ['#2e2a1c', '#6e5b21', '#c4b47a', '#f0ecd9'],
};
const motifs = {
  'dev-tools': 'abstract debugger grid and circuit traces',
  games: 'soft geometric game-world horizon without characters or logos',
  apps: 'calm desktop window frames and document planes',
  hardware: 'speaker cones and waveform ribbons',
  integrations: 'linked nodes and package silhouettes',
  learning: 'open notebook pages and annotated arrows',
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(err || `${cmd} ${code}`)));
  });
}

function svgFor(p) {
  const [bg, mid, accent, light] = tones[p.tone] || tones.mint;
  const initial = (p.initial || p.name.slice(0, 2)).slice(0, 2);
  // No project name / trademark text in the image — only abstract geometry + tiny monogram mark.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="r" cx="70%" cy="30%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="540" fill="url(#g)"/>
  <rect width="960" height="540" fill="url(#r)"/>
  <g opacity="0.22" stroke="${light}" fill="none" stroke-width="1.5">
    <path d="M60 420 C200 300 320 480 480 360 S760 280 900 180"/>
    <path d="M40 200 H920"/>
    <path d="M120 40 V500"/>
    <circle cx="720" cy="160" r="88"/>
    <rect x="180" y="120" width="220" height="140" rx="12"/>
  </g>
  <g opacity="0.35" fill="${light}">
    <circle cx="140" cy="420" r="4"/><circle cx="310" cy="350" r="4"/><circle cx="520" cy="300" r="4"/><circle cx="780" cy="220" r="4"/>
  </g>
  <rect x="48" y="48" width="72" height="72" rx="16" fill="${light}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.7"/>
  <text x="84" y="94" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="28" font-weight="600" fill="${light}">${initial.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
</svg>`;
}

const projects = await loadProjects();
const covers = JSON.parse(await readFile('src/project-covers.json', 'utf8'));
const missing = projects.filter(p => !covers[p.id]);
const added = [];

for (const p of missing) {
  const prompt = `Tasteful 16:9 editorial still for an open-source ${p.category} project about ${p.target}. Motif: ${motifs[p.category] || 'abstract tech forms'}. Palette ${p.tone}. No logos, no trademarks, no watermarks, no readable product names.`;
  const svg = svgFor(p);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const flat = await sharp(png).flatten({ background: { r: 29, g: 48, b: 38 } }).removeAlpha().png().toBuffer();
  const tmpPng = join(tmpdir(), `gen-${p.id}.png`);
  const tmpWebp = join(tmpdir(), `gen-${p.id}.webp`);
  await writeFile(tmpPng, flat);
  await run(CWEBP, ['-quiet', '-q', '84', '-m', '6', '-metadata', 'none', tmpPng, '-o', tmpWebp]);
  const bytes = await readFile(tmpWebp);
  if (bytes.toString('ascii', 12, 16) !== 'VP8 ') throw new Error(`${p.id} not VP8`);
  if (bytes.length > 250_000) throw new Error(`${p.id} too large`);
  const meta = await sharp(bytes).metadata();
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const file = `${p.id}-${hash}.webp`;
  await writeFile(`public/covers/${file}`, bytes);
  covers[p.id] = {
    sourceType: 'generated',
    src: `/covers/${file}`,
    width: meta.width,
    height: meta.height,
    prompt,
    model: 'local-svg-editorial-v1',
    generatedAt: NOW,
    checked: TODAY,
  };
  added.push(p.id);
}

await writeFile('src/project-covers.json', JSON.stringify(covers, null, 2) + '\n');
let notice = await readFile('public/covers/NOTICE.txt', 'utf8');
if (!notice.includes('Generated editorial previews')) {
  notice += `\nGenerated editorial previews (${TODAY})\nThese are original abstract SVGs rendered to WebP for catalog cards when no suitable upstream README image was available. They are not screenshots of third-party software and contain no trademarks.\n`;
}
await writeFile('public/covers/NOTICE.txt', notice.endsWith('\n') ? notice : notice + '\n');
console.log(JSON.stringify({ added: added.length, ids: added, total: Object.keys(covers).length }, null, 2));
