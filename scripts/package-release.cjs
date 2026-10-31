const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const manifest = require('../manifest.json');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
const zip = path.join(out, `xiaoxin-article-bridge-${manifest.version}.zip`);
if (fs.existsSync(zip)) fs.unlinkSync(zip);
const files = ['manifest.json', 'sidepanel.html', 'sidepanel.js', 'sidepanel.css', 'xiaoxin-theme.css', 'xiaoxin-brand.css', 'xiaoxin-diagnostics.css',
  'diagnostics.html', 'diagnostics.js', 'diagnostics.css', 'src', 'assets/icon-16.png', 'assets/icon-32.png', 'assets/icon-48.png', 'assets/icon-128.png', '_locales',
  'vendor', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'fixtures/live-x-smoke.md',
  'docs/privacy.md', 'docs/privacy.zh-CN.md'];
const entries = [];
function collect(relative) {
  const absolute = path.join(root, relative);
  assert.equal(fs.lstatSync(absolute).isSymbolicLink(), false, `No symlinks: ${relative}`);
  if (fs.statSync(absolute).isDirectory()) {
    for (const name of fs.readdirSync(absolute).sort()) collect(`${relative}/${name}`);
  } else {
    assert.equal(/(^|\/)(?:\.|output|handoff-backup|node_modules)|(?:test|playwright|HANDOFF)/i.test(relative), false, `Unexpected package entry: ${relative}`);
    const bytes = fs.readFileSync(absolute);
    assert.equal(/\/Users\/|\/private\/var\/folders\//.test(bytes.toString('utf8')), false, `Local path in ${relative}`);
    entries.push(relative);
  }
}
files.forEach(collect);
execFileSync('zip', ['-q', zip, ...entries], { cwd: root });
execFileSync('unzip', ['-t', zip]);
const actual = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');
assert.deepEqual(actual.sort(), [...entries].sort(), 'ZIP must contain exactly the allowlisted files');
const audit = actual.map((file) => {
  const source = fs.readFileSync(path.join(root, file));
  const packaged = execFileSync('unzip', ['-p', zip, file], { maxBuffer: 16 * 1024 * 1024 });
  assert.equal(packaged.equals(source), true, `Byte comparison failed: ${file}`);
  return { file, bytes: source.length, sha256: createHash('sha256').update(source).digest('hex') };
});
fs.writeFileSync(path.join(out, `xiaoxin-article-bridge-${manifest.version}.audit.json`), JSON.stringify({
  version: manifest.version,
  sha256: createHash('sha256').update(fs.readFileSync(zip)).digest('hex'),
  fileCount: audit.length,
  allBytesMatchSource: true,
  files: audit
}, null, 2) + '\n');
console.log(`Verified ${audit.length} package files byte-for-byte.`);
console.log(zip);
