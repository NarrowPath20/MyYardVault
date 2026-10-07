import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, access, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildPages} from '../tools/build-pages.js';
import {PAGES} from '../src/models/pages.js';

for (const basePath of ['/', '/MyYardVault/']) {
  test(`static Pages build resolves navigation, assets and modules at ${basePath}`, async () => {
    const output = await mkdtemp(join(tmpdir(), 'yardvault-pages-'));
    try {
      await buildPages({basePath, output});
      async function checkUrl(url) {
        if (!url.startsWith('/') || url.startsWith('//')) return;
        assert.ok(url.startsWith(basePath), url);
        const relative = url.slice(basePath.length).split(/[?#]/)[0];
        await access(join(output, relative, relative.endsWith('/') || !relative ? 'index.html' : ''));
      }
      for (const [key, page] of Object.entries(PAGES)) {
        const html = await readFile(join(output, page.path.slice(1), 'index.html'), 'utf8');
        assert.ok(html.includes(`data-page="${key}"`));
        assert.ok(html.includes('data-hosting="static"'));
        assert.ok(!html.includes('{{'));
        for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) await checkUrl(url);
      }
      const app = await readFile(join(output, 'app.js'), 'utf8');
      for (const [, url] of app.matchAll(/(?:from |import\()'([^']+)'/g)) await checkUrl(url);
      assert.ok(app.includes(`import(\`${basePath}controllers/`));
      const catalog = await readFile(join(output, 'models/catalog.js'), 'utf8');
      for (const [, url] of catalog.matchAll(/img:'([^']+)'/g)) await checkUrl(url);
      const pages = await readFile(join(output, 'models/pages.js'), 'utf8');
      assert.ok(pages.includes(`path: '${basePath}storage/'`));
      assert.ok(app.includes(`location.pathname === '${basePath}'`));
      await assert.rejects(access(join(output, 'controllers/page-controller.js')));
      await assert.rejects(access(join(output, 'server')));
      await assert.rejects(access(join(output, '.env')));
      await access(join(output, '.nojekyll'));
    } finally {
      await rm(output, {recursive: true, force: true});
    }
  });
}
