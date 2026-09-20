const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

(async () => {
  const root = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoxin-offline-extension-'));
  const output = path.join(root, 'output/playwright');
  fs.mkdirSync(output, { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true, viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`]
  });
  try {
    // This isolated profile has no user login. Never navigate to X in this test.
    await context.route(/^https?:/, route => route.abort());
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`chrome-extension://${id}/sidepanel.html`);
    await page.locator('#loadBundle').waitFor();
    const picker = page.waitForEvent('filechooser');
    await page.locator('#loadBundle').click();
    await (await picker).setFiles(path.resolve(root, 'fixtures/bundle'));
    await page.waitForFunction(() => document.querySelector('#bundleReportText')?.textContent.includes('Local check only'));
    const report = await page.locator('#bundleReportText').innerText();
    assert.ok(!report.includes('ERROR'), report);
    assert.equal((report.match(/^ready /gm) || []).length, 10, report);
    assert.equal(await page.locator('#importTitleOption').isChecked(), false);
    assert.equal(await page.locator('#importCoverOption').isChecked(), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, 'local-bundle.png'), fullPage: true });
    const result = { installedInIsolatedTestProfile: true, userChromeModified: false,
      liveXTested: false, externalHttpBlocked: true, readyReferences: 10, errors, report };
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
