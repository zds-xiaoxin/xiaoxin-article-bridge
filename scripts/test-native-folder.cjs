// Interactive native File System Access smoke test, using only public fixtures.
// Run in a desktop session and choose fixtures/bundle in the Chrome folder dialog.
// No X navigation or writes; all HTTP(S) requests are blocked.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output/playwright');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoxin-native-folder-'));
  let context;
  const errors = [];
  const launch = async () => {
    const ctx = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: false, locale: 'zh-CN', reducedMotion: 'reduce',
      viewport: { width: 1100, height: 850 },
      args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--lang=zh-CN']
    });
    await ctx.route(/^https?:/, (route) => route.abort());
    return ctx;
  };
  try {
    context = await launch();
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const url = `chrome-extension://${new URL(worker.url()).host}/sidepanel.html`;
    let page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.locator('#xbState[data-tone="empty"]').waitFor();
    assert.equal(await page.evaluate(() => typeof showDirectoryPicker), 'function');
    console.log('NATIVE_PICKER: choose fixtures/bundle, then approve the read access if Chrome asks.');
    await page.locator('#loadBundle').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor({ timeout: 180000 });
    assert.equal(await page.locator('#xbResumeName').innerText(), 'bundle');
    assert.equal(await page.locator('#xbList li[data-status="ready"]').count(), 10);
    await page.screenshot({ path: path.join(output, 'native-check.png') });
    await page.locator('#xbPreviewBtn').click();
    await page.locator('#xbPreviewBody .pv-table img').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('#xbPreviewBody img')].every((img) => img.complete && img.naturalWidth > 0));
    await page.locator('#xbPreview').evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, 'native-preview.png') });
    const result = { date: new Date().toISOString(), browserVersion: context.browser()?.version(),
      nativePickerSubstituted: false, fixture: 'fixtures/bundle', readyReferences: 10,
      bodyImages: await page.locator('#xbPreviewBody figure:not(.pv-table) img').count(),
      tables: await page.locator('#xbPreviewBody .pv-table img').count(), liveXTested: false, externalHttpBlocked: true };
    await context.close();
    context = await launch();
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    await page.locator('#xbResume').waitFor({ state: 'visible' });
    result.rememberedAfterBrowserRestart = await page.locator('#xbResumeName').innerText();
    assert.equal(result.rememberedAfterBrowserRestart, 'bundle');
    result.permissionHint = await page.locator('#xbResumeHint').innerText();
    console.log('NATIVE_RESTORE: click/approve Chrome read-access prompt if shown.');
    await page.locator('#xbResume').click();
    await page.locator('#xbSummary[data-tone="ok"]').waitFor({ timeout: 180000 });
    assert.equal(await page.locator('#xbList li[data-status="ready"]').count(), 10);
    await page.screenshot({ path: path.join(output, 'native-restored.png') });
    result.resumeAfterBrowserRestart = true;
    result.errors = errors;
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'native-result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context?.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
