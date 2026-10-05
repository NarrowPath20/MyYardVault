import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createAppServer} from '../server.js';
import {SIZES, SIZE_ORDER, SWATCHES, ST_FINISHES} from '../src/models/catalog.js';
import {DATA as office} from '../src/models/office-use-cases.js';
import {DATA as build} from '../src/models/build-walkthrough.js';
import {KB} from '../src/models/chat-knowledge.js';
import {PAGES, pageForPath} from '../src/models/pages.js';

test('assembled website and every image are served successfully', async () => {
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(!html.includes('{{>'));
    assert.ok(!html.includes('data:image/'));
    assert.equal(html.split('id="home-view"').length, 2);
    assert.ok(!html.includes('id="storage-view"'));
    assert.equal((html.match(/<header\b/g) || []).length, 1);
    assert.equal((html.match(/<footer\b/g) || []).length, 1);
    const assets = JSON.parse(await readFile(new URL('../tools/asset-manifest.json', import.meta.url)));
    for (const asset of assets) {
      const response = await fetch(base + asset.url);
      assert.equal(response.status, 200, asset.url);
      assert.equal((await response.arrayBuffer()).byteLength, asset.bytes);
    }
    for (const url of ['/app.js', '/assets/css/site.css', '/assets/css/responsive.css', '/controllers/site-controller.js', '/models/catalog.js', '/views/renderers/vault-scene.js']) {
      const response = await fetch(base + url);
      assert.equal(response.status, 200, url);
    }
    assert.equal((await fetch(base + '/server.js')).status, 404);
    assert.equal((await fetch(base + '/missing')).status, 404);
    assert.equal((await fetch(base, {method: 'POST'})).status, 405);
    assert.equal((await fetch(base, {method: 'HEAD'})).status, 200);
    assert.equal((await fetch(base + '/%E0%A4')).status, 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('every URL renders only its own page with valid navigation and a shared footer', async () => {
  const server = createAppServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const rendered = new Map();
    for (const [key, page] of Object.entries(PAGES)) {
      const response = await fetch(base + page.path);
      assert.equal(response.status, 200, page.path);
      const html = await response.text();
      rendered.set(page.path, html);
      assert.ok(html.includes(`data-page="${key}"`));
      assert.ok(!html.includes('{{'));
      for (const other of Object.keys(PAGES)) {
        assert.equal(html.includes(`id="${other}-view"`), other === key, `${page.path} contains unrelated ${other} content`);
      }
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page.path}: page heading`);
      assert.equal((html.match(/<footer\b/g) || []).length, 1);
      assert.equal(html.includes('three.min.js'), key === 'home');
      assert.equal(html.includes('id="stBgSrc"'), key === 'storage');
    }
    for (const [source, html] of rendered) {
      for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
        if (!href.startsWith('/') && !href.startsWith('#')) continue;
        if (href === '#') continue; // Supplied agent and external review placeholders.
        const url = new URL(href.replace(/&amp;/g, '&'), base + source);
        assert.ok(pageForPath(url.pathname), `${source}: unknown page ${href}`);
        if (url.hash) {
          assert.ok(rendered.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `${source}: missing target ${href}`);
        }
      }
    }
    const redirect = await fetch(base + '/storage/?preview=1', {redirect: 'manual'});
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('location'), '/storage?preview=1');
    assert.ok(!rendered.get('/').includes('id="start"'));
    assert.ok(!rendered.get('/').includes('id="galGrid"'));
    assert.ok(!rendered.get('/').includes('id="sizeTabs"'));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('product and content models retain the original catalog', () => {
  assert.equal(SIZE_ORDER.length, 7);
  assert.ok(SIZE_ORDER.every(size => SIZES[size]?.img.startsWith('/assets/images/')));
  assert.equal(SIZES['10'].price, '$4,725');
  assert.equal(SWATCHES.length, 9);
  assert.equal(ST_FINISHES.length, 10);
  assert.equal(office.length, 6);
  assert.equal(build.length, 4);
  assert.ok(KB.length > 10);
});

test('all application JavaScript parses', async () => {
  for (const directory of ['src/controllers', 'src/models', 'src/server', 'src/views/renderers', 'public']) {
    for (const file of await readdir(new URL(`../${directory}/`, import.meta.url))) {
      if (!file.endsWith('.js')) continue;
      const result = spawnSync(process.execPath, ['--check', `${directory}/${file}`], {encoding: 'utf8'});
      assert.equal(result.status, 0, result.stderr);
    }
  }
});
