#!/usr/bin/env node
/**
 * Best-effort: pull first suitable commit-pinned README image for projects lacking covers.
 * Does not invent rights; writes upstream-schema entries + NOTICE lines.
 * Usage: node scripts/ingest-covers.mjs [--limit N] [--only id1,id2]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadProjects } from './catalog.mjs';
import sharp from 'sharp';

const CWEBP = process.env.CWEBP || '/tmp/webp-root/usr/bin/cwebp';
const TODAY = new Date().toISOString().slice(0, 10);
const BADGE = /badge|shields\.io|travis|circleci|codecov|coveralls|github\.com\/.*\/actions|buymeacoffee| Liberapay|patreon|opencollective|discord\.gg|img\.shields|camo\.githubusercontent\.com\/.*badge/i;
const IMG_EXT = /\.(png|jpe?g|webp|gif)(?:$|\?)/i;

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
const onlyIdx = args.indexOf('--only');
const only = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',')) : null;

function parseGithub(url) {
  const m = String(url).match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/(?:blob|tree|raw)\/([a-f0-9]{40})\/([^?#]*))?/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, ''), sha: m[3] || null, path: m[4] || null };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'awesome-rea-cover-ingest', Accept: 'application/vnd.github.raw+json, text/plain, */*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'awesome-rea-cover-ingest' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractImages(md, owner, repo, sha) {
  const found = [];
  const re = /!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(md))) {
    let raw = (m[1] || m[2] || '').trim();
    if (!raw || BADGE.test(raw) || !IMG_EXT.test(raw)) continue;
    if (raw.startsWith('http') && !/raw\.githubusercontent\.com|user-images\.githubusercontent\.com|github\.com/.test(raw)) continue;
    let source;
    if (raw.startsWith('https://raw.githubusercontent.com/')) source = raw.split('?')[0].split('#')[0];
    else if (raw.startsWith('https://user-images.githubusercontent.com/')) source = raw.split('?')[0].split('#')[0];
    else if (raw.startsWith('https://github.com/') && /\/raw\//.test(raw)) {
      const p = parseGithub(raw.replace('/raw/', '/blob/'));
      if (p?.sha) source = `https://raw.githubusercontent.com/${p.owner}/${p.repo}/${p.sha}/${p.path}`;
    } else if (!/^https?:/i.test(raw)) {
      const path = raw.replace(/^\.\//, '').replace(/^\/+/, '');
      source = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${path}`;
    } else continue;
    if (!source || BADGE.test(source)) continue;
    found.push(source);
  }
  return [...new Set(found)];
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(err || `${cmd} exit ${code}`)));
  });
}

async function toCoverWebp(inputBuf, outPath) {
  // Flatten alpha onto paper tone, PNG intermediate, then lossy VP8 (no VP8X/ALPH).
  const png = await sharp(inputBuf, { animated: false, pages: 1 })
    .rotate()
    .resize({ width: 960, height: 720, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: { r: 246, g: 247, b: 244 } })
    .removeAlpha()
    .png()
    .toBuffer();
  const meta = await sharp(png).metadata();
  if (!meta.width || !meta.height || meta.width < 400 || meta.height < 150) {
    throw new Error(`dims ${meta.width}x${meta.height} out of range`);
  }
  const tmpPng = join(tmpdir(), `cover-${process.pid}-${Date.now()}.png`);
  await writeFile(tmpPng, png);
  await run(CWEBP, ['-quiet', '-q', '82', '-m', '6', '-metadata', 'none', tmpPng, '-o', outPath]);
  let finalBytes = await readFile(outPath);
  if (finalBytes.length > 250_000 || finalBytes.toString('ascii', 12, 16) !== 'VP8 ') {
    await run(CWEBP, ['-quiet', '-q', '68', '-m', '6', '-metadata', 'none', '-resize', String(Math.min(meta.width, 800)), '0', tmpPng, '-o', outPath]);
    finalBytes = await readFile(outPath);
  }
  const finalMeta = await sharp(finalBytes).metadata();
  if (finalBytes.length > 250_000) throw new Error(`still too large ${finalBytes.length}`);
  if (finalBytes.toString('ascii', 12, 16) !== 'VP8 ') throw new Error(`not VP8: ${finalBytes.toString('ascii', 12, 16)}`);
  return { bytes: finalBytes, width: finalMeta.width, height: finalMeta.height };
}

const projects = await loadProjects();
const covers = JSON.parse(await readFile('src/project-covers.json', 'utf8'));
let notice = await readFile('public/covers/NOTICE.txt', 'utf8');
const missing = projects.filter(p => !covers[p.id] && (!only || only.has(p.id)));
let done = 0, skipped = 0;
const report = [];

for (const p of missing) {
  if (done >= limit) break;
  const gh = parseGithub(p.evidence) || parseGithub(p.url);
  if (!gh) { report.push({ id: p.id, status: 'skip-no-github' }); skipped++; continue; }
  let sha = gh.sha;
  let owner = gh.owner, repo = gh.repo;
  try {
    if (!sha) {
      const api = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers: { 'User-Agent': 'awesome-rea-cover-ingest', Accept: 'application/vnd.github+json' } });
      if (!api.ok) throw new Error(`commits ${api.status}`);
      const [c] = await api.json();
      sha = c?.sha;
    }
    if (!sha || !/^[a-f0-9]{40}$/.test(sha)) throw new Error('no commit sha');
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/README.md`;
    let md;
    try { md = await fetchText(readmeUrl); }
    catch {
      md = await fetchText(`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/readme.md`);
    }
    const images = extractImages(md, owner, repo, sha);
    if (!images.length) { report.push({ id: p.id, status: 'skip-no-image' }); skipped++; continue; }
    let lastErr;
    let saved = false;
    for (const source of images.slice(0, 6)) {
      try {
        const raw = await fetchBytes(source);
        const tmpOut = join(tmpdir(), `out-${p.id}.webp`);
        const { bytes, width, height } = await toCoverWebp(raw, tmpOut);
        const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
        const file = `${p.id}-${hash}.webp`;
        const dest = `public/covers/${file}`;
        await writeFile(dest, bytes);
        const readme = `https://github.com/${owner}/${repo}/blob/${sha}/README.md`;
        covers[p.id] = { src: `/covers/${file}`, width, height, source, readme, checked: TODAY };
        if (!notice.includes(`\n${p.id}\n`)) {
          notice += `\n${p.id}\n${readme}\n${source}\n`;
        }
        report.push({ id: p.id, status: 'ok', source, width, height, bytes: bytes.length });
        done++;
        saved = true;
        break;
      } catch (e) { lastErr = e; }
    }
    if (!saved) { report.push({ id: p.id, status: 'skip-convert', error: String(lastErr?.message || lastErr) }); skipped++; }
  } catch (e) {
    report.push({ id: p.id, status: 'error', error: String(e.message || e) });
    skipped++;
  }
}

await writeFile('src/project-covers.json', JSON.stringify(covers, null, 2) + '\n');
await writeFile('public/covers/NOTICE.txt', notice.endsWith('\n') ? notice : notice + '\n');
await mkdir('tmp', { recursive: true });
await writeFile('tmp/cover-ingest-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ done, skipped, covers: Object.keys(covers).length, report: report.filter(r => r.status === 'ok').map(r => r.id) }, null, 2));
