/* Builds an approximate X Articles preview from the same parsed segments that get written.
   Pure string output; image URLs come from the caller (local object URLs). Links are not clickable. */
((root) => {
  const shared = root.xPosterShared || (typeof require === 'function' ? require('./shared.js') : null);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function renderInline(segment) {
    return shared.renderInlineHtml(segment, { interactiveLinks: false });
  }

  function figure(source, alt, image, labels) {
    if (!image) {
      return `<div class="pv-missing">${escapeHtml(labels.missingImage)}<code>${escapeHtml(source)}</code></div>`;
    }
    const caption = alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : '';
    const external = image.external ? ` data-external="true"` : '';
    const body = image.url
      ? `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(alt || '')}" loading="lazy">`
      : `<div class="pv-remote">${escapeHtml(labels.remoteImage)}<code>${escapeHtml(source)}</code></div>`;
    return `<figure${external}>${body}${caption}</figure>`;
  }

  function table(segment, labels, imageUrl) {
    if (imageUrl) return `<figure class="pv-table"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(labels.tableNote)}">` +
      `<figcaption>${escapeHtml(labels.tableNote)}</figcaption></figure>`;
    const align = (index) => {
      const value = segment.alignments?.[index];
      return value === 'center' || value === 'right' ? ` style="text-align:${value}"` : '';
    };
    const head = segment.headers.map((cell, index) => `<th${align(index)}>${escapeHtml(cell)}</th>`).join('');
    const rows = segment.rows.map((row) => `<tr>${segment.headers.map((_, index) =>
      `<td${align(index)}>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`).join('');
    return `<figure class="pv-table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>` +
      `<figcaption>${escapeHtml(labels.tableNote)}</figcaption></figure>`;
  }

  // parsed: shared.parseMarkdown(markdown, writeOptions). imageFor(source) -> { url, external } | null.
  function renderArticlePreview(parsed, { imageFor = () => null, tableFor = () => null, setTitle = true, setCover = true, labels = {} } = {}) {
    const html = [];
    if (!setCover) {
      html.push(`<div class="pv-cover pv-cover-kept">${escapeHtml(labels.coverKept)}</div>`);
    } else if (parsed.cover) {
      const image = imageFor(parsed.cover);
      html.push(image?.url
        ? `<div class="pv-cover"><img src="${escapeHtml(image.url)}" alt=""></div>`
        : `<div class="pv-cover pv-cover-kept">${escapeHtml(image ? labels.remoteImage : labels.missingImage)}<code>${escapeHtml(parsed.cover)}</code></div>`);
    } else {
      html.push(`<div class="pv-cover pv-cover-kept">${escapeHtml(labels.noCover)}</div>`);
    }
    if (!setTitle) html.push(`<p class="pv-title pv-title-kept">${escapeHtml(labels.titleKept)}</p>`);
    else html.push(`<h1 class="pv-title">${parsed.title ? escapeHtml(parsed.title) : `<span class="pv-muted">${escapeHtml(labels.noTitle)}</span>`}</h1>`);

    let list = null;
    const flush = () => {
      if (list) html.push(`<${list.tag}>${list.items.join('')}</${list.tag}>`);
      list = null;
    };
    const counts = { images: 0, tables: 0 };
    for (const segment of parsed.segments || []) {
      if (segment.type === 'text' && /list-item$/.test(segment.kind)) {
        const tag = segment.kind === 'ordered-list-item' ? 'ol' : 'ul';
        if (list && list.tag !== tag) flush();
        list = list || { tag, items: [] };
        list.items.push(`<li>${renderInline(segment)}</li>`);
        continue;
      }
      flush();
      if (segment.type === 'text') {
        html.push(shared.renderTextBlockHtml(segment, { interactiveLinks: false }));
      } else if (segment.type === 'image') {
        counts.images += 1;
        html.push(figure(segment.source, segment.alt, imageFor(segment.source), labels));
      } else if (segment.type === 'table') {
        counts.tables += 1;
        html.push(table(segment, labels, tableFor(segment)));
      } else if (segment.type === 'code') {
        html.push(`<pre><code>${escapeHtml(segment.code)}</code></pre>`);
      } else if (segment.type === 'divider') {
        html.push('<hr>');
      } else if (segment.type === 'tweet') {
        html.push(`<div class="pv-embed">${escapeHtml(labels.tweet)} ${escapeHtml(segment.tweetId)}</div>`);
      }
    }
    flush();
    return { html: html.join('\n'), counts };
  }

  const api = { escapeHtml, renderInline, renderArticlePreview };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinPreview = api;
})(typeof window !== 'undefined' ? window : globalThis);
