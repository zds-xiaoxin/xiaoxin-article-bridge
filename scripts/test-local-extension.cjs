// End-to-end check of the unpacked extension in a throwaway Chromium profile.
// No user profile, no login, all http(s) requests blocked; never navigates to X.
// Folder handles come from the origin-private file system (OPFS), which is a real
// FileSystemDirectoryHandle, so "continue last folder" is exercised without a native dialog.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output/playwright');

function folderPayload(dir) {
  const files = [];
  (function walk(rel) {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(child);
      else files.push({ path: child, base64: fs.readFileSync(path.join(dir, child)).toString('base64') });
    }
  })('');
  return files;
}

// Writes files into OPFS/<name> and makes showDirectoryPicker return that folder.
async function useOpfsFolder(page, name, files, extra = {}) {
  await page.evaluate(async ({ name, files, extra }) => {
    const opfs = await navigator.storage.getDirectory();
    await opfs.removeEntry(name, { recursive: true }).catch(() => {});
    const dir = await opfs.getDirectoryHandle(name, { create: true });
    const write = async (relPath, blob) => {
      const parts = relPath.split('/');
      let current = dir;
      for (const part of parts.slice(0, -1)) current = await current.getDirectoryHandle(part, { create: true });
      const handle = await current.getFileHandle(parts.at(-1), { create: true });
      const stream = await handle.createWritable();
      await stream.write(blob);
      await stream.close();
    };
    for (const file of files) {
      const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
      await write(file.path, new Blob([bytes]));
    }
    if (extra.noisePng) {
      // Synthetic incompressible PNG (random pixels) to force local compression.
      const { width, height, path: noisePath } = extra.noisePng;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const image = ctx.createImageData(width, height);
      const words = new Uint32Array(image.data.buffer);
      for (let offset = 0; offset < words.length; offset += 16384) {
        crypto.getRandomValues(words.subarray(offset, Math.min(words.length, offset + 16384)));
      }
      for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
      ctx.putImageData(image, 0, 0);
      await write(noisePath, await canvas.convertToBlob({ type: 'image/png' }));
    }
    window.showDirectoryPicker = async () => dir;
  }, { name, files, extra });
}

const rowsWithStatus = (page, status) => page.locator(`#xbList li[data-status="${status}"]`).count();

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoxin-offline-extension-'));
  fs.mkdirSync(output, { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true, locale: 'zh-CN', reducedMotion: 'reduce', viewport: { width: 420, height: 900 }, deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--lang=zh-CN']
  });
  const result = { installedInIsolatedTestProfile: true, userChromeModified: false, liveXTested: false, externalHttpBlocked: true,
    browserVersion: context.browser()?.version(), folderHandleTest: 'Real OPFS handle; native picker response substituted',
    diskFolderTest: 'Browser file chooser, real fixtures/bundle directory' };
  try {
    await context.route(/^https?:/, (route) => route.abort());
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    let page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const panelUrl = `chrome-extension://${id}/sidepanel.html`;
    const shot = (name) => page.screenshot({ path: path.join(output, name) });

    // 1. Empty state.
    await page.goto(panelUrl);
    await page.locator('#xbState[data-tone="empty"]').waitFor();
    assert.equal(await page.locator('#draftPanel').evaluate((node) => getComputedStyle(node).opacity), '1', 'panel remains visible with reduced motion');
    assert.equal(await page.locator('#xbResume').isVisible(), false);
    await shot('after-empty.png');

    // 2. Pick the public fixture folder -> check.
    await useOpfsFolder(page, 'bundle', folderPayload(path.join(root, 'fixtures/bundle')));
    await page.locator('#loadBundle').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    assert.equal(await rowsWithStatus(page, 'ready'), 10);
    assert.equal(await page.locator('#importTitleOption').isChecked(), false);
    assert.equal(await page.locator('#importCoverOption').isChecked(), false);
    assert.equal(await page.locator('#xbReplaceCover').isChecked(), false);
    assert.match(await page.locator('#markdown').inputValue(), /Public demonstration only/);
    await shot('after-check.png');

    // 3. Preview: nine body images, one table, preserved title/cover placeholders.
    await page.locator('#xbPreviewBtn').click();
    await page.locator('#xbPreviewBody figure img').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('#xbPreviewBody img')].every((img) => img.complete && img.naturalWidth > 0));
    result.preview = {
      bodyImages: await page.locator('#xbPreviewBody figure:not(.pv-table) img').count(),
      tables: await page.locator('#xbPreviewBody .pv-table').count(),
      titleKept: await page.locator('#xbPreviewBody .pv-title-kept').count(),
      coverKept: await page.locator('#xbPreviewBody .pv-cover-kept').count()
    };
    assert.deepEqual(result.preview, { bodyImages: 9, tables: 1, titleKept: 1, coverKept: 1 });
    assert.equal(await page.locator('#xbPreviewBody .pv-table img').count(), 1, 'table uses the writer\'s PNG renderer');
    assert.equal(await page.locator('#xbSteps li[data-status="active"]').innerText().then((t) => t.includes('写入')), true);
    await page.locator('#xbPreview').scrollIntoViewIfNeeded();
    await shot('after-preview.png');
    // Replacing title/cover updates the preview immediately.
    await page.locator('#xbReplaceCover').check();
    await page.locator('#xbReplaceTitle').check();
    await page.locator('#xbPreviewBody .pv-cover img').waitFor();
    assert.equal(await page.locator('#xbPreviewBody h1.pv-title').innerText(), 'Local article package demonstration');
    assert.equal(await page.locator('#importCoverOption').isChecked(), true);
    await page.locator('#xbPreview').scrollIntoViewIfNeeded();
    await shot('after-preview-cover.png');
    await page.locator('#xbReplaceCover').uncheck();
    await page.locator('#xbReplaceTitle').uncheck();

    // Editing invalidates the old preview until a fresh check succeeds.
    const previousMarkdown = await page.locator('#markdown').inputValue();
    await page.locator('#markdown').fill(`${previousMarkdown}\n\nEdited public sample.`);
    assert.equal(await page.locator('#xbPreview').isHidden(), true);
    assert.equal(await page.locator('#xbPreviewBtn').isDisabled(), true);
    await page.locator('#xbRecheck').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    await page.locator('#xbPreviewBtn').click();
    await page.waitForFunction(() => document.getElementById('xbPreviewBody').textContent.includes('Edited public sample.'));
    result.stalePreviewInvalidated = true;

    // 4. Reopen the panel: the folder is remembered and restores with one click.
    await page.close();
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(panelUrl);
    await page.locator('#xbResume').waitFor({ state: 'visible' });
    result.resumeName = await page.locator('#xbResumeName').innerText();
    assert.equal(result.resumeName, 'bundle');
    await shot('after-resume.png');
    await page.locator('#xbResume').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    assert.equal(await rowsWithStatus(page, 'ready'), 10);
    result.restoreAfterPanelClose = true;

    // 5. Obsidian embeds + oversized image -> local compression.
    const obsidianArticle = [
      '---', 'title: Obsidian compression demo', 'cover: "[[cover.png]]"', '---', '',
      '# Obsidian compression demo', '', 'Synthetic public sample. Random pixels force compression.', '',
      '![[noise.png|300]]', '', 'Inline embed ![[01.png]] inside a sentence.', '',
      '| Item | Value |', '| --- | --- |', '| Syntax | ![[name.png]] |', ''
    ].join('\n');
    const fixtureAssets = folderPayload(path.join(root, 'fixtures/bundle/assets'));
    await useOpfsFolder(page, 'obsidian-demo', [
      { path: 'article.md', base64: Buffer.from(obsidianArticle).toString('base64') },
      ...fixtureAssets.filter((f) => ['cover.png', '01.png'].includes(f.path)).map((f) => ({ ...f, path: `assets/${f.path}` }))
    ], { noisePng: { width: 2600, height: 2000, path: 'assets/noise.png' } });
    await page.locator('#loadBundle').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor({ timeout: 120000 });
    const noiseRow = page.locator('#xbList li', { hasText: 'noise.png' });
    result.compression = {
      rowText: (await noiseRow.innerText()).replace(/\s+/g, ' '),
      compressedRows: await page.locator('#xbList li .xb-size s').count(),
      notes: await page.locator('#xbNotes').innerText()
    };
    assert.equal(result.compression.compressedRows, 1);
    assert.match(result.compression.rowText, /assets\/noise\.png/);
    assert.equal(await rowsWithStatus(page, 'ready'), 3);
    await shot('after-compress.png');
    result.transparentCompression = await page.evaluate(async () => {
      const canvas = new OffscreenCanvas(256, 128);
      const ctx = canvas.getContext('2d');
      const image = ctx.createImageData(256, 128);
      crypto.getRandomValues(image.data.subarray(0, 65536));
      crypto.getRandomValues(image.data.subarray(65536));
      for (let i = 3; i < image.data.length; i += 4) image.data[i] = 128;
      ctx.putImageData(image, 0, 0);
      const original = await canvas.convertToBlob({ type: 'image/png' });
      const result = await xiaoxinImage.compressImage(original, 64 * 1024);
      const bitmap = await createImageBitmap(result.blob);
      ctx.clearRect(0, 0, 256, 128);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return { type: result.type, smaller: result.bytes < original.size, width: result.width, height: result.height,
        alphaPreserved: ctx.getImageData(0, 0, 1, 1).data[3] < 255 };
    });
    assert.deepEqual(result.transparentCompression, { type: 'image/webp', smaller: true, width: 256, height: 128, alphaPreserved: true });
    await page.locator('#xbPreviewBtn').click();
    await page.waitForFunction(() => document.querySelectorAll('#xbPreviewBody figure:not(.pv-table) img').length === 2);

    // 6. Fallback picker (<input webkitdirectory>) when the File System Access API is missing.
    await page.reload();
    await page.evaluate(() => { window.showDirectoryPicker = undefined; });
    const picker = page.waitForEvent('filechooser');
    await page.locator('#loadBundle').click();
    await (await picker).setFiles(path.resolve(root, 'fixtures/bundle'));
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    assert.equal(await rowsWithStatus(page, 'ready'), 10);
    await page.locator('#xbPreviewBtn').click();
    await page.locator('#xbPreviewBody figure:not(.pv-table) img').first().waitFor();
    result.realDiskFolderPreview = true;

    // 7. Error state: missing image.
    await useOpfsFolder(page, 'broken', [{ path: 'article.md', base64: Buffer.from('# Broken\n\n![](assets/nope.png)\n').toString('base64') }]);
    await page.locator('#loadBundle').click();
    await page.locator('#xbList li[data-status="missing"]').first().waitFor();
    assert.equal(await page.locator('#xbPreviewBtn').isDisabled(), true);
    await shot('after-error.png');

    // 8. A missing cover does not block while the existing X cover is preserved (it is not written).
    const coverOnly = folderPayload(path.join(root, 'fixtures/bundle/assets')).filter((f) => f.path === '01.png').map((f) => ({ ...f, path: 'assets/01.png' }));
    await useOpfsFolder(page, 'cover-missing', [
      { path: 'article.md', base64: Buffer.from('---\ncover: assets/gone.png\n---\n# Cover\n\n![](assets/01.png)\n').toString('base64') }, ...coverOnly]);
    await page.locator('#loadBundle').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    assert.equal(await page.locator('#xbList li[data-status="missing"][data-unused="true"]').count(), 1);
    await page.locator('#xbReplaceCover').check();
    await page.locator('#xbSummary[data-tone="warn"]').waitFor();
    assert.equal(await page.locator('#xbPreviewBtn').isDisabled(), true);
    await page.locator('#xbReplaceCover').uncheck();

    // The inherited write-option control and the card must also stay in sync.
    await page.locator('.tab[data-tab="settings"]').click();
    await page.locator('#importCoverOption').check();
    await page.locator('.tab[data-tab="draft"]').click();
    await page.locator('#xbSummary[data-tone="warn"]').waitFor();
    assert.equal(await page.locator('#xbReplaceCover').isChecked(), true);
    await page.locator('.tab[data-tab="settings"]').click();
    await page.locator('#importCoverOption').uncheck();
    await page.locator('.tab[data-tab="draft"]').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    result.writeOptionsSynced = true;

    // 9. Draft Chrome Web Store screenshots (1280x800, public fixture only) for owner review.
    const storeDir = path.join(root, 'dist/store-assets');
    fs.mkdirSync(storeDir, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await useOpfsFolder(page, 'bundle', folderPayload(path.join(root, 'fixtures/bundle')));
    await page.locator('#loadBundle').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor();
    await page.screenshot({ path: path.join(storeDir, 'screenshot-1-check-1280x800.png'), scale: 'css' });
    await page.locator('#xbPreviewBtn').click();
    await page.waitForFunction(() => [...document.querySelectorAll('#xbPreviewBody img')].every((img) => img.complete && img.naturalWidth > 0));
    await page.locator('#xbPreview').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForFunction(() => document.getElementById('xbPreview').getBoundingClientRect().top < 150);
    await page.screenshot({ path: path.join(storeDir, 'screenshot-2-preview-1280x800.png'), scale: 'css' });
    await page.locator('#xbPreviewBody').evaluate((node) => { node.scrollTop = node.scrollHeight; });
    await page.waitForFunction(() => {
      const node = document.getElementById('xbPreviewBody');
      return node.scrollHeight - node.scrollTop - node.clientHeight < 2;
    });
    await page.screenshot({ path: path.join(storeDir, 'screenshot-3-table-1280x800.png'), scale: 'css' });

    // Real settings persist the shared palette; both UI surfaces must fit narrow sidebars.
    const diagnostics = await context.newPage();
    diagnostics.on('pageerror', (error) => errors.push(error.message));
    await diagnostics.goto(`chrome-extension://${id}/diagnostics.html`);
    const assertFits = async (target, label) => {
      assert.equal(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label}: no horizontal overflow`);
      const clipped = await target.locator('button:visible').evaluateAll((nodes) => nodes.filter((node) => {
        const r = node.getBoundingClientRect();
        return r.left < 0 || r.right > innerWidth + 1 || node.scrollWidth > node.clientWidth + 1;
      }).map((node) => node.id || node.textContent.trim()));
      assert.deepEqual(clipped, [], `${label}: buttons remain fully readable`);
    };
    result.visualMatrix = [];
    for (const theme of ['light', 'dark']) {
      await page.locator('.tab[data-tab="settings"]').click();
      await page.locator(`label:has(input[name="themeMode"][value="${theme}"])`).click();
      await page.locator('.tab[data-tab="draft"]').click();
      await diagnostics.waitForFunction((theme) => document.documentElement.dataset.theme === theme, theme);
      const expected = theme === 'light' ? 'rgb(255, 253, 248)' : 'rgb(36, 30, 25)';
      assert.equal(await page.locator('.composer').evaluate((node) => getComputedStyle(node).backgroundColor), expected);
      assert.equal(await diagnostics.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor), expected);
      for (const width of [320, 360, 420]) {
        await page.setViewportSize({ width, height: 900 });
        await diagnostics.setViewportSize({ width, height: 900 });
        await page.evaluate(() => { document.documentElement.scrollTop = 0; });
        for (const section of ['draft', 'records', 'settings']) {
          await page.locator(`.tab[data-tab="${section}"]`).click();
          await assertFits(page, `${theme}/${width}/${section}`);
        }
        await page.locator('.tab[data-tab="draft"]').click();
        await assertFits(diagnostics, `${theme}/${width}/diagnostics`);
        await shot(`panel-${theme}-${width}.png`);
        await diagnostics.screenshot({ path: path.join(output, `diagnostics-${theme}-${width}.png`) });
        result.visualMatrix.push({ theme, width, sections: ['draft', 'records', 'settings', 'diagnostics'], fits: true });
      }
    }
    await shot('after-dark.png');
    // System mode resolves OS appearance, and stays synchronized across open surfaces.
    await page.locator('.tab[data-tab="settings"]').click();
    await page.locator('label:has(input[name="themeMode"][value="system"])').click();
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme });
      await diagnostics.emulateMedia({ colorScheme });
      await page.waitForFunction((theme) => document.documentElement.dataset.theme === theme, colorScheme);
      await diagnostics.waitForFunction((theme) => document.documentElement.dataset.theme === theme, colorScheme);
    }
    result.systemThemeSynced = true;
    await diagnostics.close();
    await page.locator('.tab[data-tab="draft"]').click();
    result.sidebarWidths = [320, 360, 420];

    // Writing needs a logged-in X Articles tab; stop here.
    result.writeButtonText = (await page.locator('#importDraft').innerText()).trim();
    result.errors = errors;
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
