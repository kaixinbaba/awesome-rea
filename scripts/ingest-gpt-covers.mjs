#!/usr/bin/env node
/** Ingest GPT project-fitting PNGs/JPGs into static WebP covers (sourceType=generated).
 *  Only adds/replaces entries that are missing OR already sourceType=generated.
 *  Never overwrites upstream / non-generated covers.
 *  Env: GPT_COVERS_DIR (default ./gpt-raw), ONLY=comma ids
 */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const CWEBP = process.env.CWEBP || 'cwebp';
const SRC_DIR = process.env.GPT_COVERS_DIR || join(process.cwd(), 'gpt-raw');
const TODAY = new Date().toISOString().slice(0, 10);
const NOW = new Date().toISOString();
const MODEL = process.env.GPT_COVER_MODEL || 'gpt-image-2';
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',').filter(Boolean)) : null;

const PROMPTS = JSON.parse(await readFile(join(SRC_DIR, 'prompts.json'), 'utf8'));

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(err || `${cmd} ${code}`)));
  });
}

function findSource(id) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const path = join(SRC_DIR, `${id}.${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
}

const covers = JSON.parse(await readFile('src/project-covers.json', 'utf8'));
const ids = Object.keys(PROMPTS).filter(id => !ONLY || ONLY.has(id));
const updated = [];
const skipped = [];

for (const id of ids) {
  const old = covers[id];
  if (old && old.sourceType !== 'generated') {
    skipped.push({ id, reason: 'non-generated cover preserved' });
    continue;
  }
  const srcPath = findSource(id);
  if (!srcPath) {
    skipped.push({ id, reason: 'missing image file' });
    continue;
  }
  const prompt = PROMPTS[id];
  if (!prompt || prompt.length < 20) throw new Error(`missing prompt for ${id}`);

  const resized = await sharp(srcPath)
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

  const oldName = old?.src?.split('/').at(-1);
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
const gptBlock = `\nGPT project-fitting covers (${TODAY})\nOriginal art matched to each project's subject via Codex Images. No trademarks/logos/watermarks. Model: ${MODEL}.\n`;
if (!notice.includes(`Model: ${MODEL}`)) {
  notice = notice.endsWith('\n') ? notice : notice + '\n';
  notice += gptBlock;
}
await writeFile('public/covers/NOTICE.txt', notice.endsWith('\n') ? notice : notice + '\n');

console.log(JSON.stringify({ updated: updated.length, skipped, items: updated, model: MODEL }, null, 2));
