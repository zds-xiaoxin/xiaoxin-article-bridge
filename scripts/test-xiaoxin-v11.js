const assert = require('node:assert/strict');
const { test } = require('node:test');
const bundleApi = require('../src/xiaoxin-bundle.js');
const imageApi = require('../src/xiaoxin-image.js');
const memory = require('../src/xiaoxin-folder-memory.js');
const preview = require('../src/xiaoxin-preview.js');
const shared = require('../src/shared.js');

const MiB = 1024 * 1024;
const file = (name, size = 32, type = 'image/png') => ({ name: name.split('/').pop(), size, type });
const entry = (path, size, type) => ({ path, file: file(path, size, type) });
const md = (path = 'article.md') => ({ path, file: { name: path, size: 10, type: 'text/markdown' } });

// --- Obsidian syntax -------------------------------------------------------
test('parses Obsidian embed sources with width and wiki brackets', () => {
  assert.deepEqual(bundleApi.parseImageSource('图片.png|300'), { path: '图片.png', width: 300 });
  assert.deepEqual(bundleApi.parseImageSource('[[cover.png]]'), { path: 'cover.png', width: null });
  assert.deepEqual(bundleApi.parseImageSource('a.png|300x200'), { path: 'a.png', width: 300 });
  assert.deepEqual(bundleApi.parseImageSource('<a b.png>'), { path: 'a b.png', width: null });
  assert.deepEqual(bundleApi.parseImageSource('a.png|caption'), { path: 'a.png', width: null });
});
test('shared parser recognises own-line and inline image embeds only', () => {
  const parsed = shared.parseMarkdown('# T\n\n![[图片.png|300]]\n\n文字 ![[b c.jpg]] 结尾\n\n引用 ![[某笔记]] 不是图片');
  const images = parsed.segments.filter((s) => s.type === 'image').map((s) => s.source);
  assert.deepEqual(images, ['图片.png|300', 'b c.jpg']);
  assert.ok(parsed.segments.some((s) => s.type === 'text' && s.text.includes('![[某笔记]]')));
});
test('resolves Obsidian names in same folder, assets/, then unique name anywhere', () => {
  const bundle = bundleApi.createBundle([md(), entry('same.png'), entry('assets/图片.png'), entry('attachments/deep.png'),
    entry('x/dup.png'), entry('y/dup.png')]);
  assert.equal(bundle.locate('same.png').path, 'same.png');
  assert.equal(bundle.locate('图片.png|300').path, 'assets/图片.png');
  assert.equal(bundle.locate('deep.png').path, 'attachments/deep.png');
  assert.equal(bundle.locate('dup.png'), null, 'ambiguous names are not guessed');
  assert.equal(bundle.locate('other/deep.png'), null, 'explicit paths are not rewritten');
  assert.throws(() => bundle.locate('../secret.png'));
});
test('literal percent signs in Obsidian names do not throw', () => {
  const bundle = bundleApi.createBundle([md(), entry('assets/100%.png')]);
  assert.equal(bundle.locate('100%.png').path, 'assets/100%.png');
});
test('Obsidian embeds are inlined, width dropped, prose untouched', async () => {
  const markdown = '---\ncover: "[[cover.png]]"\n---\n# T\n\n![[图片.png|300]]\n\n说明 ![[b.png]] 结尾';
  const bundle = bundleApi.createBundle([md(), entry('assets/图片.png'), entry('assets/cover.png'), entry('b.png')]);
  const check = bundleApi.inspect(bundle, shared.parseMarkdown(markdown), shared);
  assert.equal(check.ok, true, JSON.stringify(check.rows));
  const output = await bundleApi.inlineMedia(markdown, bundle, shared, async () => 'data:image/png;base64,aGVsbG8=', { setCover: true });
  assert.ok(!output.includes('![['));
  assert.ok(output.includes('说明'));
  const parsed = shared.parseMarkdown(output);
  assert.equal(parsed.segments.filter((s) => s.type === 'image').length, 2);
  assert.ok(parsed.cover.startsWith('data:image/png'));
});
test('folder entries from a directory handle walk build the same bundle', () => {
  const bundle = bundleApi.createBundle([md(), entry('assets/a.png')], { name: 'demo' });
  assert.equal(bundle.entry, 'article.md');
  assert.equal(bundle.name, 'demo');
  assert.ok(bundle.resolve('assets/a.png'));
});
test('image-like code, escaped examples and table cells stay literal when inlining', async () => {
  const markdown = [
    '# T', '', '![[a.png|300]]', '', '![real](a(b).png)', '',
    '`![[a.png|300]]` and `![code](a(b).png)`', '', '\\![[a.png|300]]', '',
    '```md', '![[a.png|300]]', '![code](a(b).png)', '```', '',
    '| A |', '| --- |', '| ![[a.png|300]] |'
  ].join('\n');
  const bundle = bundleApi.createBundle([md(), entry('a.png'), entry('a(b).png')]);
  const parsed = shared.parseMarkdown(markdown, { setCover: false });
  assert.equal(parsed.segments.filter((s) => s.type === 'image').length, 2);
  const output = await bundleApi.inlineMedia(markdown, bundle, shared, async () => 'data:image/png;base64,aGk=', { setCover: false });
  assert.ok(output.includes('`![[a.png|300]]` and `![code](a(b).png)`'));
  assert.ok(output.includes('\\![[a.png|300]]'));
  assert.ok(output.includes('```md\n![[a.png|300]]\n![code](a(b).png)\n```'));
  assert.ok(output.includes('| ![[a.png|300]] |'));
  assert.equal(shared.parseMarkdown(output).segments.filter((s) => s.type === 'image').length, 2);
});
test('an unused oversized cover is listed but excluded from compression and write budgets', () => {
  const bundle = bundleApi.createBundle([md(), entry('assets/cover.gif', 30 * MiB, 'image/gif'), entry('assets/a.png', MiB)]);
  const parsed = shared.parseMarkdown('---\ncover: assets/cover.gif\n---\n![](assets/a.png)');
  const report = bundleApi.inspect(bundle, parsed, shared, { setCover: false });
  assert.equal(report.bytes, MiB);
  assert.equal(report.files.length, 1);
  assert.equal(report.ok, true);
  assert.equal(report.rows.find((r) => r.role === 'cover').unused, true);
  assert.equal(bundleApi.inspect(bundle, parsed, shared, { setCover: true }).ok, false);
});

// --- Compression ----------------------------------------------------------
test('fitWithin keeps aspect ratio and never upscales', () => {
  assert.deepEqual(imageApi.fitWithin(8000, 4000, 4096), { width: 4096, height: 2048 });
  assert.deepEqual(imageApi.fitWithin(3000, 6000, 4096), { width: 2048, height: 4096 });
  assert.deepEqual(imageApi.fitWithin(800, 600, 4096), { width: 800, height: 600 });
});
test('encode attempts lower quality first, then shrink to the minimum edge', () => {
  const attempts = imageApi.encodeAttempts(6000, 3000);
  assert.deepEqual(attempts.slice(0, 2).map((a) => a.quality), [0.9, 0.82]);
  assert.equal(Math.max(attempts[0].width, attempts[0].height), 4096);
  const last = attempts.at(-1);
  assert.equal(Math.max(last.width, last.height), imageApi.LIMITS.minEdge);
  for (const a of attempts) assert.ok(Math.abs(a.width / a.height - 2) < 0.01);
});
test('output keeps transparency as WebP and uses JPEG otherwise', () => {
  assert.equal(imageApi.outputTypeFor('image/png', true), 'image/webp');
  assert.equal(imageApi.outputTypeFor('image/png', false), 'image/jpeg');
  assert.equal(imageApi.outputTypeFor('image/jpeg', true), 'image/jpeg');
});
test('plan caps single large images and leaves small ones alone', () => {
  const plan = imageApi.planCompression([{ id: 'a', bytes: 9 * MiB, type: 'image/png' }, { id: 'b', bytes: MiB, type: 'image/png' }]);
  assert.equal(plan.targets.get('a'), 5 * MiB);
  assert.equal(plan.targets.has('b'), false);
  assert.equal(plan.impossible, false);
});
test('plan water-fills the package under 24 MiB', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: String(i), bytes: 4 * MiB, type: 'image/jpeg' }));
  items.push({ id: 'small', bytes: 200 * 1024, type: 'image/png' });
  const plan = imageApi.planCompression(items);
  let total = 0;
  for (const item of items) total += plan.targets.get(item.id) ?? item.bytes;
  assert.ok(total <= 24 * MiB * 0.95 + 16, `total ${total}`);
  assert.equal(plan.targets.has('small'), false);
  assert.equal(plan.impossible, false);
});
test('GIFs are never planned for compression and large ones are flagged', () => {
  const plan = imageApi.planCompression([{ id: 'g', bytes: 7 * MiB, type: 'image/gif' }]);
  assert.equal(plan.targets.size, 0);
  assert.deepEqual(plan.largeGifs, ['g']);
  assert.equal(imageApi.planCompression([{ id: 'g', bytes: 30 * MiB, type: 'image/gif' }]).impossible, true);
});
test('inspect counts compressed sizes and reads compressed bytes when inlining', async () => {
  const big = file('assets/a.png', 30 * MiB);
  const bundle = bundleApi.createBundle([md(), { path: 'assets/a.png', file: big }]);
  const parsed = shared.parseMarkdown('![](assets/a.png)');
  assert.equal(bundleApi.inspect(bundle, parsed, shared).ok, false);
  const blob = { size: 3 * MiB, type: 'image/jpeg' };
  bundle.setOverride(big, { blob, bytes: blob.size, type: blob.type });
  const check = bundleApi.inspect(bundle, parsed, shared);
  assert.equal(check.ok, true);
  assert.equal(check.rows[0].originalBytes, 30 * MiB);
  assert.equal(check.rows[0].bytes, 3 * MiB);
  let read = null;
  await bundleApi.inlineMedia('![](assets/a.png)', bundle, shared, async (value) => { read = value; return 'data:image/jpeg;base64,aGk='; });
  assert.equal(read, blob);
});
test('formatBytes is readable', () => {
  assert.equal(imageApi.formatBytes(5 * MiB), '5.0 MiB');
  assert.equal(imageApi.formatBytes(2048), '2 KiB');
});

// --- Folder memory ----------------------------------------------------------
function memoryStore() {
  const data = new Map();
  return { get: async (k) => data.get(k), set: async (k, v) => { data.set(k, v); }, delete: async (k) => { data.delete(k); } };
}
function dirHandle(name, children, permission = 'granted') {
  const state = { permission, requested: 0 };
  return {
    kind: 'directory', name, state,
    async *values() { yield* children; },
    async queryPermission() { return state.permission; },
    async requestPermission() { state.requested += 1; state.permission = state.grantOnRequest || 'denied'; return state.permission; }
  };
}
const fileHandle = (name, size = 10, type = 'image/png') => ({ kind: 'file', name, getFile: async () => ({ name, size, type }) });

test('saves and restores the last folder handle', async () => {
  const store = memoryStore();
  const handle = dirHandle('文章A', []);
  await memory.saveLastFolder(store, handle, 1000);
  const record = await memory.loadLastFolder(store);
  assert.equal(record.handle, handle);
  assert.equal(record.name, '文章A');
  assert.deepEqual(memory.restoreState(record, 'granted'), { action: 'ready', name: '文章A', savedAt: 1000 });
  await memory.forgetLastFolder(store);
  assert.equal(await memory.loadLastFolder(store), null);
  assert.deepEqual(memory.restoreState(null, 'granted'), { action: 'none' });
});
test('ignores corrupt records and rejects non-folder handles', async () => {
  const store = memoryStore();
  await store.set(memory.KEY, { handle: { kind: 'file' } });
  assert.equal(await memory.loadLastFolder(store), null);
  await assert.rejects(memory.saveLastFolder(store, { kind: 'file', name: 'x' }));
});
test('permission is only requested when the user asked for it', async () => {
  const handle = dirHandle('A', [], 'prompt');
  assert.equal(await memory.ensureReadPermission(handle), 'prompt');
  assert.equal(handle.state.requested, 0);
  assert.equal(memory.restoreState({ name: 'A' }, 'prompt').action, 'needs-permission');
  handle.state.grantOnRequest = 'granted';
  assert.equal(await memory.ensureReadPermission(handle, { request: true }), 'granted');
  assert.equal(handle.state.requested, 1);
  assert.equal(await memory.ensureReadPermission(handle, { request: true }), 'granted');
  assert.equal(handle.state.requested, 1, 'already granted does not prompt again');
  const denied = dirHandle('B', [], 'prompt');
  assert.equal(await memory.ensureReadPermission(denied, { request: true }), 'denied');
  assert.equal(memory.restoreState({ name: 'B' }, 'denied').action, 'denied');
});
test('collects Markdown and images, skipping hidden and vault folders', async () => {
  const root = dirHandle('pkg', [
    fileHandle('article.md', 10, 'text/markdown'), fileHandle('notes.txt'), fileHandle('.DS_Store'),
    dirHandle('assets', [fileHandle('01.png'), dirHandle('nested', [fileHandle('02.webp')])]),
    dirHandle('.obsidian', [fileHandle('x.png')]), dirHandle('node_modules', [fileHandle('y.png')])
  ]);
  const entries = await memory.collectEntries(root);
  assert.deepEqual(entries.map((e) => e.path), ['article.md', 'assets/01.png', 'assets/nested/02.webp']);
  const bundle = bundleApi.createBundle(entries);
  assert.ok(bundle.resolve('assets/nested/02.webp'));
});
test('refuses to walk an oversized folder', async () => {
  const root = dirHandle('vault', Array.from({ length: 5 }, (_, i) => fileHandle(`${i}.png`)));
  await assert.rejects(memory.collectEntries(root, { maxFiles: 3, maxDepth: 6 }), /more than 3/);
});

// --- Preview ----------------------------------------------------------------
const labels = { coverKept: 'KEEP-COVER', titleKept: 'KEEP-TITLE', noCover: 'NO-COVER', noTitle: 'NO-TITLE',
  missingImage: 'MISSING', remoteImage: 'REMOTE', tableNote: 'TABLE-AS-IMAGE', tweet: 'TWEET' };
test('preview renders title, cover, body images in order, lists and tables', () => {
  const parsed = shared.parseMarkdown('---\ncover: c.png\n---\n# 标题 <x>\n\n第一段 **粗体** [链接](javascript:alert(1))\n\n![说明](a.png)\n\n- 一\n- 二\n\n| A | B |\n| --- | :-: |\n| 1 | 2 |\n\n![](missing.png)');
  const urls = { 'c.png': 'blob:cover', 'a.png': 'blob:a' };
  const { html, counts } = preview.renderArticlePreview(parsed, { imageFor: (s) => urls[s] ? { url: urls[s] } : null, labels });
  assert.ok(html.includes('<h1 class="pv-title">标题 &lt;x&gt;</h1>'));
  assert.ok(html.indexOf('blob:cover') < html.indexOf('blob:a'));
  assert.ok(html.includes('<strong>粗体</strong>'));
  assert.ok(!html.includes('href='), 'links are not clickable in the side panel');
  assert.ok(html.includes('<ul><li>一</li><li>二</li></ul>'));
  assert.ok(html.includes('style="text-align:center"'));
  assert.ok(html.includes('TABLE-AS-IMAGE'));
  assert.ok(html.includes('MISSING'));
  assert.deepEqual(counts, { images: 2, tables: 1 });
});
test('preview reflects preserved title and cover', () => {
  const parsed = shared.parseMarkdown('# 标题\n\n正文', { setTitle: false, setCover: false });
  const { html } = preview.renderArticlePreview(parsed, { setTitle: false, setCover: false, labels });
  assert.ok(html.includes('KEEP-TITLE') && html.includes('KEEP-COVER'));
  assert.ok(html.includes('<h1>标题</h1>'), 'H1 stays in the body when the title is preserved, as when writing');
});
test('preview text shares the writer renderer and accepts the exact table PNG', () => {
  const parsed = shared.parseMarkdown('# T\n\n**Bold** _italic_ [Link](https://example.test)\n\n| A |\n| --- |\n| B |');
  const text = parsed.segments.find((s) => s.type === 'text');
  assert.equal(preview.renderInline(text), shared.renderInlineHtml(text, { interactiveLinks: false }));
  const { html } = preview.renderArticlePreview(parsed, { labels, tableFor: () => 'data:image/png;base64,aGk=' });
  assert.ok(html.includes('<figure class="pv-table"><img src="data:image/png;base64,aGk="'));
  assert.ok(!html.includes('<table>'));
});
