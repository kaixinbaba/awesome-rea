import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const upstreamKeys = ['checked', 'height', 'readme', 'source', 'src', 'width'];
const generatedKeys = ['checked', 'generatedAt', 'height', 'model', 'prompt', 'src', 'width'];

function validateShared(id, c) {
  assert(typeof c.src === 'string' && new RegExp(`^/covers/${id}-[a-f0-9]{12}\\.webp$`).test(c.src), `${id}: unsafe cover asset path`);
  assert(Number.isInteger(c.width) && c.width >= 400 && c.width <= 960, `${id}: invalid cover width`);
  assert(Number.isInteger(c.height) && c.height >= 150 && c.height <= 720, `${id}: invalid cover height`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(c.checked) && new Date(c.checked).toISOString().slice(0, 10) === c.checked && c.checked <= new Date().toISOString().slice(0, 10), `${id}: invalid cover review date`);
}

function validateUpstream(id, c) {
  assert.deepEqual(Object.keys(c).filter(k => k !== 'sourceType').sort(), upstreamKeys);
  if (Object.hasOwn(c, 'sourceType')) assert.equal(c.sourceType, 'upstream');
  validateShared(id, c);
  assert(typeof c.readme === 'string' && /^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[a-f0-9]{40}\/(?:[^?#]*\/)?readme(?:\.md)?$/i.test(c.readme), `${id}: commit-pinned README required`);
  const url = new URL(c.source);
  assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash, `${id}: unsafe image source`);
  assert(['raw.githubusercontent.com', 'github.com', 'user-images.githubusercontent.com'].includes(url.hostname), `${id}: unsupported image host`);
}

function validateGenerated(id, c) {
  assert.equal(c.sourceType, 'generated');
  assert.deepEqual(Object.keys(c).filter(k => k !== 'sourceType').sort(), generatedKeys);
  validateShared(id, c);
  assert(typeof c.prompt === 'string' && c.prompt.trim().length >= 20 && c.prompt.length <= 2000, `${id}: generated cover needs a prompt`);
  assert(!/[<>\u0000-\u001f\u007f]/u.test(c.prompt), `${id}: control/markup in prompt`);
  assert(typeof c.model === 'string' && c.model.trim() && c.model.length <= 120, `${id}: generated cover needs a model id`);
  assert(/^\d{4}-\d{2}-\d{2}T/.test(c.generatedAt) && !Number.isNaN(Date.parse(c.generatedAt)), `${id}: invalid generatedAt`);
}

// Reviewed, same-origin previews only. Builds and browsers never crawl upstream READMEs.
export function validateCovers(covers, projects) {
  assert(covers && typeof covers === 'object' && !Array.isArray(covers), 'Cover map must be an object');
  const ids = new Set(projects.map(p => p.id));
  for (const [id, c] of Object.entries(covers)) {
    assert(ids.has(id), `Unknown cover project: ${id}`);
    assert(c && typeof c === 'object' && !Array.isArray(c), `${id}: cover entry must be an object`);
    if (c.sourceType === 'generated') validateGenerated(id, c);
    else validateUpstream(id, c);
  }
  return covers;
}

export function isGeneratedCover(c) {
  return c?.sourceType === 'generated';
}

export async function loadCovers(projects) {
  const covers = validateCovers(JSON.parse(await readFile(new URL('../src/project-covers.json', import.meta.url), 'utf8')), projects);
  const expected = ['NOTICE.txt'];
  for (const [id, c] of Object.entries(covers)) {
    const bytes = await readFile(new URL(`../public${c.src}`, import.meta.url));
    assert(bytes.length > 0 && bytes.length <= 250_000, `${id}: cover exceeds size budget`);
    assert(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', `${id}: expected WebP image`);
    assert(bytes.toString('ascii', 12, 16) === 'VP8 ' && bytes.length === bytes.readUInt32LE(4) + 8, `${id}: expected static, metadata-free WebP`);
    assert.equal(bytes.readUInt16LE(26) & 0x3fff, c.width, `${id}: cover width differs from file`);
    assert.equal(bytes.readUInt16LE(28) & 0x3fff, c.height, `${id}: cover height differs from file`);
    assert(c.src.endsWith(`-${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}.webp`), `${id}: cover content hash mismatch`);
    expected.push(c.src.split('/').at(-1));
  }
  assert.deepEqual((await readdir(new URL('../public/covers/', import.meta.url))).sort(), expected.sort(), 'Missing or untracked cover assets');
  return covers;
}
