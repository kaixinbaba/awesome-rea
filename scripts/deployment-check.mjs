import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const origin = 'https://awesomerea.com';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await files(`${dir}/${entry.name}`, `${name}/`));
    else if (entry.isFile() && !['_headers', '_redirects'].includes(name)) result.push(name);
    else if (!entry.isFile()) throw new Error(`Unexpected artifact entry: ${name}`);
  }
  return result.sort();
}
const manifest = new Map(await Promise.all((await files('dist')).map(async name => [name, sha256(await readFile(`dist/${name}`))])));
assert(manifest.has('index.html') && manifest.has('zh/404.html'), 'Expected bilingual build artifact');

async function check() {
  let deployment;
  if (process.env.GITHUB_SHA) {
    const { GITHUB_SHA, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
    assert(/^[a-f0-9]{40}$/.test(GITHUB_SHA), 'Invalid expected commit');
    assert(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN, 'Missing release credentials');
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/awesomerea`, {
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` }, signal: AbortSignal.timeout(10000),
    });
    assert.equal(r.status, 200, 'Cloudflare project verification HTTP status');
    const data = await r.json();
    assert.equal(data.success, true, 'Cloudflare project verification failed');
    const d = data.result.canonical_deployment;
    assert.equal(d?.environment, 'production');
    assert.equal(d?.latest_stage?.status, 'success');
    assert.equal(d?.deployment_trigger?.metadata?.branch, 'main');
    assert.equal(d?.deployment_trigger?.metadata?.commit_hash, GITHUB_SHA, 'Production commit differs from this main workflow');
    deployment = { id: d.id, commit: GITHUB_SHA };
  }
  for (const [file, hash] of manifest) {
    const path = '/' + (file.endsWith('index.html') ? file.slice(0, -10) : file);
    const r = await fetch(origin + path, { signal: AbortSignal.timeout(10000) });
    assert.equal(r.status, 200, path);
    assert.equal(sha256(Buffer.from(await r.arrayBuffer())), hash, `Production bytes differ: ${path}`);
    if (path === '/') {
      const csp = r.headers.get('content-security-policy');
      assert(csp?.includes('https://www.googletagmanager.com') && csp.includes('https://www.google-analytics.com'), 'Required analytics CSP');
      assert(!csp.includes('unsafe-'), 'Unsafe CSP');
      assert.equal(r.headers.get('x-frame-options'), 'DENY');
    }
  }
  for (const [path, file] of [['/missing-deployment-check', '404.html'], ['/zh/deep/missing-deployment-check', 'zh/404.html']]) {
    const r = await fetch(origin + path, { signal: AbortSignal.timeout(10000) });
    assert.equal(r.status, 404, path);
    assert.equal(sha256(Buffer.from(await r.arrayBuffer())), manifest.get(file), path);
  }
  const redirect = await fetch('https://awesomerea.pages.dev/zh/?deployment-check=1', { redirect: 'manual', signal: AbortSignal.timeout(10000) });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('location'), `${origin}/zh/?deployment-check=1`);
  return { checks: manifest.size + 3, deployment };
}
// A completed deployment can briefly precede propagation to the custom domain.
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    const result = await check();
    console.log(`PASS: ${result.checks} production file/404/redirect checks${result.deployment ? `; production ${result.deployment.id}, main ${result.deployment.commit}` : ''}`);
    break;
  } catch (error) {
    if (attempt === 6) throw error;
    console.error(`Production verification attempt ${attempt}: ${error.message}`);
    await delay(3000);
  }
}
