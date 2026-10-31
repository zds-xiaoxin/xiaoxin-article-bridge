// Export the original generated artwork without remote requests or user profiles.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataUrl = (file) => `data:image/png;base64,${fs.readFileSync(path.join(root, file)).toString('base64')}`;

(async () => {
  const browser = await chromium.launch({ channel: 'chromium', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
    await page.route(/^https?:/, (route) => route.abort());
    const icon = dataUrl('docs/brand/article-bridge-master.png');
    const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;background:#fffdf8;color:#2b2118;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
      main{width:440px;height:280px;padding:24px;border:3px solid #2b2118;display:flex;flex-direction:column;gap:18px}
      header{display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;letter-spacing:1px}
      header b{background:#ff6b3d;border:1.5px solid #2b2118;border-radius:30px;padding:3px 10px;letter-spacing:0}
      section{display:flex;align-items:center;gap:20px;flex:1}img{width:108px;height:108px}h1{font-size:32px;line-height:1.2;letter-spacing:-1px;margin:0 0 8px;font-weight:900}
      p{font-size:13px;margin:0;line-height:1.65;font-weight:600}footer{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #2b2118;padding-top:12px;font-size:12px;font-weight:750}
      footer strong{padding:7px 12px;border:2px solid #2b2118;border-radius:10px;background:#ff6b3d;box-shadow:0 4px 0 #2b2118}
      </style><main><header><span>XIAOXIN ARTICLE BRIDGE</span><b>v1.2</b></header>
      <section><img alt="文章与拱桥原创标志" src="${icon}"><div><h1>小新文章桥</h1><p>Markdown 和本地配图<br>一起搬进 X Articles 草稿</p></div></section>
      <footer><span>本地检查 · 压缩 · 预览</span><strong>发布由你决定</strong></footer></main></html>`;
    fs.writeFileSync(path.join(root, 'docs/brand/promotional-440x280.html'), html.replace(icon, 'article-bridge-master.png'));
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(root, 'docs/brand/promotional-440x280.png') });
    const storeIcon = await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
      canvas.getContext('2d').drawImage(img, 16, 16, 96, 96);
      return canvas.toDataURL('image/png').split(',')[1];
    }, icon);
    fs.writeFileSync(path.join(root, 'docs/brand/store-icon-128.png'), Buffer.from(storeIcon, 'base64'));
    await page.setViewportSize({ width: 640, height: 300 });
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>
      body{margin:0;padding:24px;background:#fffdf8;color:#2b2118;font:14px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
      h1{font-size:22px;margin:0 0 22px}section{display:flex;align-items:end;gap:32px}figure{margin:0;text-align:center}figcaption{margin-top:12px}
      </style><h1>小新文章桥 · 原创标志 / v1.2.0</h1><section>${[16,32,48,128].map((size) => `<figure><img src="${dataUrl(`assets/icon-${size}.png`)}" width="${size}" height="${size}"><figcaption>${size} × ${size}</figcaption></figure>`).join('')}</section>`);
    await page.screenshot({ path: path.join(root, 'docs/brand/identity-preview.png') });
    fs.mkdirSync(path.join(root, 'dist/store-assets'), { recursive: true });
    for (const file of ['promotional-440x280.png', 'store-icon-128.png']) {
      fs.copyFileSync(path.join(root, 'docs/brand', file), path.join(root, 'dist/store-assets', file));
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
