#!/usr/bin/env node
/** Replace sourceType=generated SVG editorial covers with GPT project-fitting WebP. */
import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const CWEBP = process.env.CWEBP || 'cwebp';
const SRC_DIR = process.env.GPT_COVERS_DIR || '/workspace/awesomerea-gpt-covers';
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();
const MODEL = 'gpt-image-1';

const PROMPTS = JSON.parse(await readFile(join(SRC_DIR, 'prompts.json'), 'utf8'));

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(err || `${cmd} ${code}`)));
  });
}

const covers = JSON.parse(await readFile('src/project-covers.json', 'utf8'));
const generated = Object.entries(covers).filter(([, c]) => c.sourceType === 'generated');
if (generated.length === 0) throw new Error('no generated covers');

const updated = [];
for (const [id, old] of generated) {
  const jpg = join(SRC_DIR, `${id}.jpg`);
  if (!existsSync(jpg)) throw new Error(`missing GPT jpg: ${jpg}`);
  const prompt = PROMPTS[id];
  if (!prompt || prompt.length < 20) throw new Error(`missing prompt for ${id}`);

  const resized = await sharp(jpg)
    .resize(960, 540, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .jpeg({ quality: 92 })
    .toBuffer();
  const tmpJpg = join(tmpdir(), `gpt-${id}.jpg`);
  const tmpWebp = join(tmpdir(), `gpt-${id}.webp`);
  await writeFile(tmpJpg, resized);

  let q = 82;
  let bytes;
  for (;;) {
    await run(CWEBP, ['-quiet', '-q', String(q), '-m', '6', '-metadata', 'none', tmpJpg, '-o', tmpWebp]);
    bytes = await readFile(tmpWebp);
    if (bytes.length <= 250_000 || q <= 60) break;
    q -= 6;
  }
  if (bytes.toString('ascii', 12, 16) !== 'VP8 ') throw new Error(`${id} not VP8`);
  if (bytes.length > 250_000) throw new Error(`${id} still too large: ${bytes.length}`);

  const meta = await sharp(bytes).metadata();
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const file = `${id}-${hash}.webp`;
  await writeFile(`public/covers/${file}`, bytes);

  // remove old asset for this id if different
  const oldName = old.src?.split('/').at(-1);
  if (oldName && oldName !== file) {
    try { await unlink(`public/covers/${oldName}`); } catch {}
  }

  covers[id] = {
    sourceType: 'generated',
    src: `/covers/${file}`,
    width: meta.width,
    height: meta.height,
    prompt,
    model: MODEL,
    generatedAt: NOW,
    checked: TODAY,
  };
  updated.push({ id, file, bytes: bytes.length, q });
}

await writeFile('src/project-covers.json', JSON.stringify(covers, null, 2) + '\n');

let notice = await readFile('public/covers/NOTICE.txt', 'utf8');
const gptBlock = `\nGPT project-fitting covers (${TODAY})\nReplaced abstract local-svg-editorial previews with GPT-generated images matched to each project's subject. Original art, no trademarks/logos/watermarks. Model: ${MODEL}.\n`;
if (!notice.includes('GPT project-fitting covers')) {
  notice += gptBlock;
}
await writeFile('public/covers/NOTICE.txt', notice.endsWith('\n') ? notice : notice + '\n');

console.log(JSON.stringify({ updated: updated.length, items: updated }, null, 2));
