const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const bundleApi = require('../src/xiaoxin-bundle.js');
const shared = require('../src/shared.js');
const image = (name, size = 32) => ({ name, type: 'image/png', size, webkitRelativePath: 'package/' + name });
const doc = (name = 'article.md') => ({ name, size: 32, webkitRelativePath: 'package/' + name });
const imageData = 'data:image/png;base64,aGVsbG8=';

test('normalizes Unicode, escaped spaces and dot path', () => {
  assert.equal(bundleApi.normalizePath('./assets/a%20b.png'), 'assets/a b.png');
  assert.equal(bundleApi.normalizePath('assets/e\u0301.png'), 'assets/é.png');
});
test('rejects parent traversal, absolute and scheme paths', () => {
  for (const value of ['../secret', 'assets/%2e%2e/secret', '/Users/test', 'file:///a', 'C:\\a']) {
    assert.throws(() => bundleApi.normalizePath(value));
  }
});
test('article.md wins over instruction Markdown', () => {
  assert.equal(bundleApi.createBundle([doc(), doc('使用说明.md')]).entry, 'article.md');
});
test('ambiguous documents and duplicate paths fail', () => {
  assert.throws(() => bundleApi.createBundle([doc('a.md'), doc('b.md')]));
  assert.throws(() => bundleApi.createBundle([doc(), doc()]));
});
test('nested Markdown resolves images relative to its folder', () => {
  const file = image('story/assets/a.png');
  assert.equal(bundleApi.createBundle([doc('story/post.md'), file]).resolve('assets/a.png'), file);
});
test('missing file is not readiness', () => {
  const result = bundleApi.inspect(bundleApi.createBundle([doc()]), shared.parseMarkdown('![](assets/missing.png)'), shared);
  assert.equal(result.ok, false);
  assert.equal(result.rows[0].status, 'missing');
});
test('rejects oversized and unsupported media', () => {
  const parsed = shared.parseMarkdown('![](a.png)');
  assert.equal(bundleApi.inspect(bundleApi.createBundle([doc(), image('a.png', bundleApi.MAX_BYTES + 1)]), parsed, shared).ok, false);
  assert.equal(bundleApi.inspect(bundleApi.createBundle([doc(), { ...image('a.png'), type: 'text/html' }]), parsed, shared).ok, false);
});
test('inlines cover and body without changing prose or input', async () => {
  const markdown = '---\ntitle: Test\ncover: ./assets/a.png\n---\n# Test\n\nKeep assets/a.png as text.\n![test](assets/a.png)';
  const bundle = bundleApi.createBundle([doc(), image('assets/a.png')]);
  const output = await bundleApi.inlineMedia(markdown, bundle, shared, async () => imageData);
  assert.ok(output.includes('Keep assets/a.png as text.'));
  assert.equal(shared.parseMarkdown(output).cover, imageData);
  assert.equal(shared.parseMarkdown(output).segments.filter((s) => s.type === 'image')[0].source, imageData);
  assert.ok(markdown.includes('![test](assets/a.png)'));
});
test('fails closed when file read fails or payload is not an image', async () => {
  const bundle = bundleApi.createBundle([doc(), image('a.png')]);
  await assert.rejects(bundleApi.inlineMedia('![](a.png)', bundle, shared, async () => { throw new Error('Unreadable'); }));
  await assert.rejects(bundleApi.inlineMedia('![](a.png)', bundle, shared, async () => 'data:text/html;base64,YQ=='));
});
test('remote image remains external without network access', async () => {
  const markdown = '![](https://example.com/image.png)';
  const output = await bundleApi.inlineMedia(markdown, bundleApi.createBundle([doc()]), shared, async () => { throw new Error('Must not read'); });
  assert.equal(output, markdown);
});
test('preserve-cover mode does not read unused cover', async () => {
  const output = await bundleApi.inlineMedia('---\ncover: missing.png\n---\nHello', bundleApi.createBundle([doc()]), shared, async () => { throw new Error('Must not read'); }, { setCover: false });
  assert.ok(output.includes('Hello'));
});
test('public fixture retains nine images and one table after conversion', async () => {
  const root = path.resolve(__dirname, '../fixtures/bundle');
  const markdown = fs.readFileSync(path.join(root, 'article.md'), 'utf8');
  const files = [doc(), ...fs.readdirSync(path.join(root, 'assets')).map((name) => ({
    ...image('assets/' + name), size: fs.statSync(path.join(root, 'assets', name)).size,
    fullPath: path.join(root, 'assets', name)
  }))];
  const bundle = bundleApi.createBundle(files);
  const initial = bundleApi.inspect(bundle, shared.parseMarkdown(markdown), shared);
  assert.equal(initial.ok, true);
  assert.equal(initial.rows.filter((r) => r.role === 'body').length, 9);
  const output = await bundleApi.inlineMedia(markdown, bundle, shared,
    async (file) => 'data:image/png;base64,' + fs.readFileSync(file.fullPath).toString('base64'));
  const parsed = shared.parseMarkdown(output);
  assert.equal(parsed.segments.filter((s) => s.type === 'image').length, 9);
  assert.equal(parsed.segments.filter((s) => s.type === 'table').length, 1);
  assert.ok(parsed.cover.startsWith('data:image/png;base64,'));
  assert.ok(output.includes('Public demonstration only'));
});
