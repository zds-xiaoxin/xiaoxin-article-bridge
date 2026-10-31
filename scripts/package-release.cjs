const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = require('../manifest.json');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
const zip = path.join(out, `xiaoxin-article-bridge-${manifest.version}.zip`);
if (fs.existsSync(zip)) fs.unlinkSync(zip);
const files = ['manifest.json', 'sidepanel.html', 'sidepanel.js', 'sidepanel.css', 'xiaoxin-theme.css',
  'diagnostics.html', 'diagnostics.js', 'diagnostics.css', 'src', 'assets', '_locales',
  'vendor', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'fixtures/live-x-smoke.md',
  'docs/privacy.md', 'docs/privacy.zh-CN.md'];
execFileSync('zip', ['-q', '-r', zip, ...files], { cwd: root });
execFileSync('unzip', ['-t', zip]);
console.log(zip);
