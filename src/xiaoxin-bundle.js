/* Local-only folder handling. No network, browser permissions, or persistent media storage. */
((root) => {
  const MAX_BYTES = 24 * 1024 * 1024;
  const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

  function normalizePath(value) {
    const text = decodeURIComponent(String(value)).normalize('NFC').replace(/\\/g, '/');
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

  function createBundle(files) {
    const map = new Map();
    for (const file of files) {
      const raw = file.webkitRelativePath || file.name;
      const withoutRoot = file.webkitRelativePath ? raw.split('/').slice(1).join('/') : raw;
      const key = normalizePath(withoutRoot);
      if (map.has(key)) throw new Error(`Duplicate file: ${key}`);
      map.set(key, file);
    }
    const candidates = [...map.keys()].filter((key) => /\.md$/i.test(key));
    const entry = candidates.includes('article.md') ? 'article.md' : candidates.length === 1 ? candidates[0] : null;
    if (!entry) throw new Error('Include article.md, or exactly one Markdown file.');
    const prefix = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/') + 1) : '';
    return { entry, file: map.get(entry), resolve: (source) => map.get(normalizePath(prefix + normalizePath(source))) };
  }

  function inspect(bundle, parsed, shared) {
    const references = (parsed.segments || []).filter((s) => s.type === 'image')
      .map((s) => ({ role: 'body', source: s.source }));
    if (parsed.cover) references.push({ role: 'cover', source: parsed.cover });
    let bytes = 0;
    const counted = new Set();
    const rows = references.map((ref) => {
      if (!shared.isLocalImageSource(ref.source)) return { ...ref, status: 'external' };
      try {
        const file = bundle.resolve(ref.source);
        if (!file) return { ...ref, status: 'missing' };
        if (!IMAGE_TYPES.has(file.type)) return { ...ref, status: 'unsupported' };
        if (!counted.has(file)) { bytes += file.size; counted.add(file); }
        return { ...ref, status: 'ready', bytes: file.size };
      } catch (error) { return { ...ref, status: 'invalid', error: error.message }; }
    });
    return { rows, bytes, ok: bytes <= MAX_BYTES && rows.every((r) => r.status === 'ready' || r.status === 'external') };
  }

  async function inlineMedia(markdown, bundle, shared, readDataUrl, options = {}) {
    const parsed = shared.parseMarkdown(markdown, options);
    const report = inspect(bundle, parsed, shared);
    if (!report.ok) throw new Error('Missing/unsupported images or package exceeds 24 MiB.');
    const replacements = new Map();
    for (const row of report.rows.filter((r) => r.status === 'ready')) {
      if (!replacements.has(row.source)) {
        const data = await readDataUrl(bundle.resolve(row.source));
        if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(data)) {
          throw new Error('Invalid image data.');
        }
        replacements.set(row.source, data);
      }
    }
    // Only replace supported image syntax and frontmatter cover, never body prose.
    let result = markdown.replace(/(!\[[^\]\n]*\]\()([^\n)]*)(\))/g,
      (match, before, source, after) => replacements.has(source.trim()) ? before + replacements.get(source.trim()) + after : match);
    result = result.replace(/!\[\[([^\]\n]+)\]\]/g,
      (match, source) => replacements.has(source.trim()) ? `![](${replacements.get(source.trim())})` : match);
    result = result.replace(/^(---\r?\n)([\s\S]*?)(\r?\n---)/, (whole, begin, meta, end) => begin + meta.replace(
      /^(cover|Cover|封面):\s*(.+)$/gm,
      (line, key, value) => replacements.has(parsed.cover) ? `${key}: ${replacements.get(parsed.cover)}` : line
    ) + end);
    const finalParsed = shared.parseMarkdown(result, options);
    if ((finalParsed.segments || []).some((s) => s.type === 'image' && shared.isLocalImageSource(s.source)) ||
        (finalParsed.cover && shared.isLocalImageSource(finalParsed.cover))) {
      throw new Error('Unsupported image syntax: use ![caption](assets/image.png).');
    }
    if (result.length > 40 * 1024 * 1024) throw new Error('Expanded package exceeds 40 MiB.');
    return result;
  }

  const api = { normalizePath, createBundle, inspect, inlineMedia, MAX_BYTES };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinBundle = api;
})(typeof window !== 'undefined' ? window : globalThis);
