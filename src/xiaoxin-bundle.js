/* Local-only folder handling. No network or remote storage; compressed copies live in memory only. */
((root) => {
  const MAX_BYTES = 24 * 1024 * 1024;
  // Per-image ceiling enforced by the upload pipeline (shared.js MAX_IMAGE_BYTES).
  const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
  const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

  function normalizePath(value) {
    let text = String(value);
    try { text = decodeURIComponent(text); } catch { /* keep literal names such as "100%.png" */ }
    text = text.normalize('NFC').replace(/\\/g, '/');
    if (/^(?:\/|[a-z][a-z\d+.-]*:)/i.test(text) || text.includes('\0')) {
      throw new Error('Only package-relative paths are accepted.');
    }
    const parts = [];
    for (const part of text.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') throw new Error('Parent directory references are not accepted.');
      parts.push(part);
    }
    return parts.join('/');
  }

  // Accepts "a.png", "<a b.png>", Obsidian "a.png|300" and "[[a.png]]" (frontmatter properties).
  function parseImageSource(source) {
    let text = String(source || '').trim().replace(/^!?\[\[/, '').replace(/\]\]$/, '').trim();
    if (/^<.*>$/.test(text)) text = text.slice(1, -1).trim();
    let width = null;
    const pipe = text.indexOf('|');
    if (pipe >= 0) {
      const option = text.slice(pipe + 1).trim();
      const size = /^(\d+)(?:\s*x\s*\d+)?$/i.exec(option);
      if (size) width = Number(size[1]);
      text = text.slice(0, pipe).trim();
    }
    return { path: text, width };
  }

  function entryOf(item) {
    if (item && item.file && typeof item.path === 'string') return { key: normalizePath(item.path), file: item.file };
    const raw = item.webkitRelativePath || item.name;
    const withoutRoot = item.webkitRelativePath ? raw.split('/').slice(1).join('/') : raw;
    return { key: normalizePath(withoutRoot), file: item };
  }

  // items: File objects from <input webkitdirectory>, or { path, file } from a directory handle walk.
  function createBundle(items, meta = {}) {
    const map = new Map();
    for (const item of items) {
      const { key, file } = entryOf(item);
      if (map.has(key)) throw new Error(`Duplicate file: ${key}`);
      map.set(key, file);
    }
    const candidates = [...map.keys()].filter((key) => /\.md$/i.test(key));
    const entry = candidates.includes('article.md') ? 'article.md' : candidates.length === 1 ? candidates[0] : null;
    if (!entry) throw new Error('Include article.md, or exactly one Markdown file.');
    const prefix = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/') + 1) : '';
    const byName = new Map();
    for (const key of map.keys()) {
      const name = key.slice(key.lastIndexOf('/') + 1);
      byName.set(name, [...(byName.get(name) || []), key]);
    }
    const overrides = new Map();

    // Same folder first, then assets/, then (bare names only) a unique file name anywhere in the package,
    // which matches how Obsidian resolves ![[image.png]].
    function locate(source) {
      const rel = normalizePath(parseImageSource(source).path);
      if (!rel) return null;
      for (const key of [prefix + rel, prefix + 'assets/' + rel]) {
        if (map.has(key)) return { path: key, file: map.get(key) };
      }
      if (!rel.includes('/')) {
        const hits = byName.get(rel) || [];
        if (hits.length === 1) return { path: hits[0], file: map.get(hits[0]) };
      }
      return null;
    }

    return {
      entry,
      file: map.get(entry),
      name: meta.name || '',
      size: map.size,
      locate,
      resolve: (source) => locate(source)?.file,
      setOverride: (file, info) => (info ? overrides.set(file, info) : overrides.delete(file)),
      clearOverrides: () => overrides.clear(),
      override: (file) => overrides.get(file) || null,
      effective: (file) => overrides.get(file)?.blob || file
    };
  }

  function referencesOf(parsed) {
    const references = (parsed.segments || []).filter((s) => s.type === 'image')
      .map((s) => ({ role: 'body', source: s.source }));
    if (parsed.cover) references.push({ role: 'cover', source: parsed.cover });
    return references;
  }

  function inspect(bundle, parsed, shared, options = {}) {
    let bytes = 0;
    let originalBytes = 0;
    const counted = new Set();
    const files = [];
    const rows = referencesOf(parsed).map((reference) => {
      const ref = { ...reference, unused: reference.role === 'cover' && options.setCover === false };
      if (!shared.isLocalImageSource(ref.source)) return { ...ref, status: 'external' };
      try {
        const found = bundle.locate ? bundle.locate(ref.source) : { file: bundle.resolve(ref.source) };
        const file = found?.file;
        if (!file) return { ...ref, status: 'missing' };
        if (!IMAGE_TYPES.has(file.type)) return { ...ref, status: 'unsupported', path: found.path, type: file.type };
        const override = bundle.override ? bundle.override(file) : null;
        const size = override ? override.bytes : file.size;
        if (!ref.unused && !counted.has(file)) {
          bytes += size;
          originalBytes += file.size;
          counted.add(file);
          files.push({ file, path: found.path, bytes: file.size, type: file.type });
        }
        const status = size > MAX_IMAGE_BYTES ? 'too-large' : 'ready';
        return { ...ref, status, path: found.path, type: file.type, bytes: size, originalBytes: file.size,
          compressed: Boolean(override), outputType: override?.type || file.type };
      } catch (error) { return { ...ref, status: 'invalid', error: error.message }; }
    });
    return {
      rows, bytes, originalBytes, files, limit: MAX_BYTES,
      ok: bytes <= MAX_BYTES && rows.every((r) => r.unused || r.status === 'ready' || r.status === 'external')
    };
  }

  async function inlineMedia(markdown, bundle, shared, readDataUrl, options = {}) {
    const parsed = shared.parseMarkdown(markdown, options);
    const report = inspect(bundle, parsed, shared);
    if (!report.ok) throw new Error('Missing/unsupported images or package exceeds 24 MiB.');
    const replacements = new Map();
    for (const row of report.rows.filter((r) => r.status === 'ready')) {
      if (!replacements.has(row.source)) {
        const file = bundle.resolve(row.source);
        const data = await readDataUrl(bundle.effective ? bundle.effective(file) : file);
        if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(data)) {
          throw new Error('Invalid image data.');
        }
        replacements.set(row.source, data);
      }
    }
    // Only replace supported image syntax and frontmatter cover, never body prose.
    let result = shared.mapMarkdownImageSources(markdown, (source) => replacements.get(source));
    result = result.replace(/^(---\r?\n)([\s\S]*?)(\r?\n---)/, (whole, begin, meta, end) => begin + meta.replace(
      /^(cover|Cover|封面):\s*(.+)$/gm,
      (line, key, value) => replacements.has(parsed.cover) ? `${key}: ${replacements.get(parsed.cover)}` : line
    ) + end);
    const finalParsed = shared.parseMarkdown(result, options);
    if ((finalParsed.segments || []).some((s) => s.type === 'image' && shared.isLocalImageSource(s.source)) ||
        (finalParsed.cover && shared.isLocalImageSource(finalParsed.cover))) {
      throw new Error('Unsupported image syntax: use ![caption](assets/image.png) or ![[image.png]].');
    }
    if (result.length > 40 * 1024 * 1024) throw new Error('Expanded package exceeds 40 MiB.');
    return result;
  }

  const api = { normalizePath, parseImageSource, createBundle, referencesOf, inspect, inlineMedia, MAX_BYTES, MAX_IMAGE_BYTES };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinBundle = api;
})(typeof window !== 'undefined' ? window : globalThis);
