/* Article-folder card in the side panel: pick/continue folder -> check (+ compress) -> preview -> write.
   All file work is local. Writing itself stays in sidepanel.js and never publishes. */
((root) => {
  const TEXT = {
    zh: {
      steps: ['选文件夹', '检查', '预览', '写入草稿'],
      pick: '选择文章文件夹',
      resume: '继续上次的文件夹',
      resumeNeedsPermission: '点击后 Chrome 会再次询问读取权限',
      resumeDenied: '读取权限被拒绝，可再点一次重新授权，或改选文件夹',
      forget: '忘记',
      emptyTitle: '把整篇文章搬进 X 草稿',
      emptyBody: '选择包含 article.md 和 assets/ 的文件夹。只在本机读取，写入前不会上传任何内容。',
      reading: '正在读取文件夹…',
      checking: '正在检查配图…',
      compressing: '正在本地压缩第 {index}/{total} 张图片：{name}',
      recheck: '重新检查',
      preview: '预览效果',
      refreshPreview: '刷新预览',
      hidePreview: '收起',
      goWrite: '去写入草稿',
      replaceTitle: '用文章标题替换 X 中的标题',
      replaceCover: '用文章封面替换 X 中的封面',
      summaryOk: '{count} 处图片引用可用 · 本次写入共 {bytes} / 24 MiB',
      summaryBad: '{bad} 处需要处理 · 共 {bytes} / 24 MiB',
      totalTooLarge: '压缩后仍超过 24 MiB，请减少图片或手动缩小后重新选择文件夹。',
      compressedNote: '已在本地压缩 {count} 张图片：{before} → {after}。原文件不会被修改。',
      missing: '缺失', unsupported: '格式不支持', invalid: '路径无效', 'too-large': '过大', ready: '就绪', external: '远程',
      body: '正文', cover: '封面',
      coverUnused: '保留已有封面，不会写入',
      gifNote: 'GIF 不压缩（会丢失动画）：{name} 为 {bytes}，X 可能拒收，建议手动缩小。',
      gifKept: 'GIF 保留动画，不参与压缩：{name}（{bytes}）。',
      notReached: '{name} 已尽量压缩到 {bytes}，仍高于 5 MiB 的建议值。',
      impossible: '即使压缩也放不进 24 MiB（GIF 等无法压缩的文件已占 {bytes}），请减少图片。',
      fixMissing: '有图片找不到或格式不支持。请把图片放进 assets/ 或与 article.md 同级，支持 PNG/JPEG/WebP/GIF。',
      stale: '正文已改动，写入前请重新检查。',
      errorTitle: '没能完成',
      permissionLost: '没有获得读取权限。请再点一次“继续上次的文件夹”并允许，或重新选择文件夹。',
      folderGone: '上次的文件夹找不到了（可能已移动或删除），请重新选择。',
      queueActive: '请先退出多篇待发队列，再导入单篇文章文件夹。',
      tooBigMd: 'Markdown 超过 512 KiB。',
      previewTitle: '写入前预览（近似 X 长文样式）',
      previewNote: '实际排版以 X 为准。图片宽度参数会被忽略；远程图片不在预览中加载。',
      coverKept: '封面：保留 X 草稿里已有的封面',
      titleKept: '标题：保留 X 草稿里已有的标题（正文中的 # 标题会作为小标题写入）',
      noCover: '未设置封面',
      noTitle: '（没有标题）',
      missingImage: '缺图：',
      remoteImage: '远程图片，写入时下载：',
      tableNote: '表格写入时会转成图片',
      tweet: '嵌入推文',
      written: '已发送到 X 草稿。请在 X 页面检查图片、表格、标题和封面后自行发布。'
    },
    en: {
      steps: ['Folder', 'Check', 'Preview', 'Write draft'],
      pick: 'Choose article folder',
      resume: 'Continue last folder',
      resumeNeedsPermission: 'Chrome will ask for read access again',
      resumeDenied: 'Read access was denied. Click again to re-grant, or pick a folder.',
      forget: 'Forget',
      emptyTitle: 'Bring a whole article into an X draft',
      emptyBody: 'Choose a folder containing article.md and assets/. Files are read locally; nothing is uploaded before you write.',
      reading: 'Reading folder…',
      checking: 'Checking images…',
      compressing: 'Compressing image {index}/{total} locally: {name}',
      recheck: 'Check again',
      preview: 'Preview',
      refreshPreview: 'Refresh preview',
      hidePreview: 'Hide',
      goWrite: 'Go to Write',
      replaceTitle: 'Replace the X title with the article title',
      replaceCover: 'Replace the X cover with the article cover',
      summaryOk: '{count} image references available · write uses {bytes} of 24 MiB',
      summaryBad: '{bad} need attention · {bytes} of 24 MiB',
      totalTooLarge: 'Still over 24 MiB after compression. Remove or resize images, then choose the folder again.',
      compressedNote: 'Compressed {count} image(s) locally: {before} → {after}. Original files are untouched.',
      missing: 'Missing', unsupported: 'Unsupported', invalid: 'Invalid path', 'too-large': 'Too large', ready: 'Ready', external: 'Remote',
      body: 'Body', cover: 'Cover',
      coverUnused: 'Existing cover kept; not written',
      gifNote: 'GIFs are not compressed (animation would be lost): {name} is {bytes}; X may reject it.',
      gifKept: 'GIF animation kept, not compressed: {name} ({bytes}).',
      notReached: '{name} compressed as far as possible to {bytes}, still above the 5 MiB guideline.',
      impossible: 'Cannot fit 24 MiB even after compression (non-compressible files use {bytes}). Remove some images.',
      fixMissing: 'Some images are missing or unsupported. Put them in assets/ or next to article.md; PNG/JPEG/WebP/GIF only.',
      stale: 'The Markdown changed. Check again before writing.',
      errorTitle: 'Could not finish',
      permissionLost: 'Read access was not granted. Click “Continue last folder” and allow, or choose the folder again.',
      folderGone: 'The last folder could not be found (moved or deleted). Choose it again.',
      queueActive: 'Exit the multi-draft queue before importing one article folder.',
      tooBigMd: 'Markdown exceeds 512 KiB.',
      previewTitle: 'Preview before writing (approximate X Articles style)',
      previewNote: 'X decides the final layout. Image width hints are ignored; remote images are not loaded here.',
      coverKept: 'Cover: the existing X draft cover is kept',
      titleKept: 'Title: the existing X draft title is kept (a # heading in the body is written as a subheading)',
      noCover: 'No cover',
      noTitle: '(No title)',
      missingImage: 'Missing image: ',
      remoteImage: 'Remote image, downloaded when writing: ',
      tableNote: 'Tables are written as images',
      tweet: 'Embedded post',
      written: 'Sent to the X draft. Check images, tables, title and cover on X, then publish yourself.'
    }
  };
  const MAX_MARKDOWN_BYTES = 512 * 1024;

  function createBridgePanel(deps) {
    const { shared, bundleApi, imageApi, memory, preview, doc = root.document } = deps;
    const $ = (id) => doc.getElementById(id);
    const els = {
      card: $('xbCard'), steps: $('xbSteps'), pick: $('loadBundle'), resume: $('xbResume'), resumeName: $('xbResumeName'),
      resumeHint: $('xbResumeHint'), forget: $('xbForget'), state: $('xbState'), stateTitle: $('xbStateTitle'),
      stateBody: $('xbStateBody'), check: $('xbCheck'), summary: $('xbSummary'), list: $('xbList'), notes: $('xbNotes'),
      recheck: $('xbRecheck'), previewBtn: $('xbPreviewBtn'), titleOpt: $('xbReplaceTitle'), coverOpt: $('xbReplaceCover'),
      previewBox: $('xbPreview'), previewBody: $('xbPreviewBody'), previewClose: $('xbPreviewClose'), goWrite: $('xbGoWrite')
    };
    const store = memory.idbStore();
    const state = { bundle: null, report: null, notes: [], busy: false, error: '', stale: false, previewed: false,
      written: false, previewVersion: 0, urls: new Map(), restore: { action: 'none' } };

    const lang = () => (String(doc.documentElement.lang || root.xPosterI18n?.language?.() || 'en').startsWith('zh') ? 'zh' : 'en');
    const t = (key, vars = {}) => {
      const value = TEXT[lang()][key] ?? TEXT.en[key] ?? key;
      return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : value;
    };
    const fmt = imageApi.formatBytes;
    const esc = preview.escapeHtml;
    const baseName = (path) => String(path || '').split('/').pop();

    // Rows that would stop the write. An unused cover (title/cover preserved) is informational only.
    function blockingRows() {
      const coverPreserved = deps.getImportOptions().setCover === false;
      return (state.report?.rows || []).filter((row) => row.status !== 'ready' && row.status !== 'external' &&
        !(row.role === 'cover' && coverPreserved));
    }

    function isOk() {
      return Boolean(state.report) && state.report.bytes <= state.report.limit && !blockingRows().length;
    }

    function currentStep() {
      if (!state.bundle) return 0;
      if (!isOk() || state.stale) return 1;
      if (!state.previewed) return 2;
      return 3;
    }

    function renderSteps() {
      const active = currentStep();
      const failed = Boolean(state.error) || (state.report && !isOk());
      els.steps.innerHTML = t('steps').map((label, index) => {
        let status = index < active ? 'done' : index === active ? 'active' : 'todo';
        if (index === 3 && state.written) status = 'done';
        if (index === active && failed && index <= 1) status = 'error';
        return `<li data-status="${status}"><span class="xb-step-dot">${status === 'done' ? '✓' : index + 1}</span><span>${esc(label)}</span></li>`;
      }).join('');
    }

    function setState(tone, title, body = '') {
      els.state.dataset.tone = tone;
      els.stateTitle.textContent = title;
      els.stateBody.textContent = body;
      els.state.hidden = false;
    }

    function renderStatic() {
      els.pick.textContent = t('pick');
      els.forget.textContent = t('forget');
      els.recheck.textContent = t('recheck');
      els.previewBtn.textContent = state.previewed && !els.previewBox.hidden ? t('refreshPreview') : t('preview');
      els.previewClose.textContent = t('hidePreview');
      els.goWrite.textContent = t('goWrite');
      $('xbPreviewTitle').textContent = t('previewTitle');
      $('xbPreviewNote').textContent = t('previewNote');
      $('xbReplaceTitleLabel').textContent = t('replaceTitle');
      $('xbReplaceCoverLabel').textContent = t('replaceCover');
      const options = deps.getImportOptions();
      els.titleOpt.checked = options.setTitle !== false;
      els.coverOpt.checked = options.setCover !== false;
    }

    function renderResume() {
      const { action, name } = state.restore;
      els.resume.hidden = action === 'none';
      els.forget.hidden = action === 'none';
      if (action === 'none') return;
      $('xbResumeLabel').textContent = t('resume');
      els.resumeName.textContent = name || '';
      els.resumeHint.hidden = action === 'ready';
      els.resumeHint.textContent = action === 'denied' ? t('resumeDenied') : t('resumeNeedsPermission');
    }

    function renderCheck() {
      const report = state.report;
      els.check.hidden = !report;
      if (!report) return;
      const coverPreserved = deps.getImportOptions().setCover === false;
      const bad = blockingRows();
      const counted = report.rows.filter((row) => row.status === 'ready' || row.status === 'external').length;
      els.summary.dataset.tone = isOk() && !state.stale ? 'ok' : 'warn';
      els.summary.textContent = bad.length
        ? t('summaryBad', { bad: bad.length, bytes: fmt(report.bytes) })
        : t('summaryOk', { count: counted, bytes: fmt(report.bytes) });
      els.list.innerHTML = report.rows.map((row) => {
        const unused = row.role === 'cover' && coverPreserved;
        const size = row.bytes == null ? '' : row.compressed
          ? `<span class="xb-size"><s>${fmt(row.originalBytes)}</s> → <b>${fmt(row.bytes)}</b> ${esc(row.outputType.replace('image/', '').toUpperCase())}</span>`
          : `<span class="xb-size">${fmt(row.bytes)}</span>`;
        const shown = bundleApi.parseImageSource(row.source).path || row.source;
        const details = [row.path && row.path !== shown ? `→ ${esc(row.path)}` : '', unused ? esc(t('coverUnused')) : '']
          .filter(Boolean).join(' · ');
        return `<li data-status="${esc(row.status)}"${unused ? ' data-unused="true"' : ''}>` +
          `<span class="xb-chip">${esc(t(row.status))}</span>` +
          `<span class="xb-role">${esc(t(row.role))}</span>` +
          `<span class="xb-path" title="${esc(row.source)}"><code>${esc(shown)}</code>${details ? `<small>${details}</small>` : ''}</span>${size}</li>`;
      }).join('');
      const notes = [...state.notes];
      if (bad.length) notes.unshift({ tone: 'error', text: t('fixMissing') });
      if (report.bytes > report.limit) notes.unshift({ tone: 'error', text: t('totalTooLarge') });
      if (state.stale) notes.unshift({ tone: 'warn', text: t('stale') });
      els.notes.innerHTML = notes.map((note) => `<p data-tone="${note.tone}">${esc(note.text)}</p>`).join('');
      els.previewBtn.disabled = !isOk() || state.stale;
    }

    function render() {
      renderSteps();
      renderStatic();
      renderResume();
      renderCheck();
      els.card.dataset.busy = state.busy ? 'true' : 'false';
      els.card.setAttribute('aria-busy', String(state.busy));
      for (const button of [els.pick, els.resume, els.recheck, els.previewBtn, els.titleOpt, els.coverOpt, els.goWrite]) {
        button.disabled = state.busy || (button === els.previewBtn && (!isOk() || state.stale));
      }
      if (state.busy) return;
      if (state.error) setState('error', t('errorTitle'), state.error);
      else if (!state.bundle) setState('empty', t('emptyTitle'), t('emptyBody'));
      else if (state.written) setState('done', t('written'));
      else els.state.hidden = true;
    }

    function fail(error) {
      state.busy = false;
      state.error = error?.message || String(error);
      render();
    }

    function revokeUrls() {
      state.previewVersion += 1;
      for (const url of state.urls.values()) URL.revokeObjectURL(url);
      state.urls.clear();
    }

    async function refreshRestore() {
      try {
        const record = await memory.loadLastFolder(store);
        state.restore = memory.restoreState(record, record ? await memory.readPermission(record.handle) : null);
      } catch {
        state.restore = { action: 'none' };
      }
      render();
    }

    async function loadItems(items, name) {
      if (deps.queueModeActive()) throw new Error(t('queueActive'));
      if (items.length > memory.LIMITS.maxFiles) throw new Error(`Folder has more than ${memory.LIMITS.maxFiles} files. Choose the article folder, not the whole vault.`);
      const bundle = bundleApi.createBundle(items, { name });
      if (bundle.file.size > MAX_MARKDOWN_BYTES) throw new Error(t('tooBigMd'));
      const text = await bundle.file.text();
      revokeUrls();
      Object.assign(state, { bundle, report: null, notes: [], stale: false, previewed: false, written: false, error: '' });
      els.previewBox.hidden = true;
      deps.setBundle(bundle);
      await deps.setImportOptions({ setTitle: false, setCover: false, allowGraphqlMetadata: false });
      deps.setMarkdown(text, bundle.entry);
      await runCheck();
    }

    async function loadFromHandle(handle) {
      state.busy = true;
      state.error = '';
      setState('loading', t('reading'), handle.name);
      render();
      let entries;
      try {
        entries = await memory.collectEntries(handle);
      } catch (error) {
        if (error?.name === 'NotFoundError') {
          await memory.forgetLastFolder(store).catch(() => {});
          state.restore = { action: 'none' };
          throw new Error(t('folderGone'));
        }
        if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw new Error(t('permissionLost'));
        throw error;
      }
      await loadItems(entries, handle.name);
    }

    function pickWithInput() {
      const input = doc.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.addEventListener('change', async () => {
        const files = [...(input.files || [])];
        if (!files.length) return;
        try {
          state.busy = true;
          setState('loading', t('reading'));
          render();
          await loadItems(files, (files[0].webkitRelativePath || '').split('/')[0]);
        } catch (error) { fail(error); }
      });
      input.click();
    }

    async function pickFolder() {
      if (typeof root.showDirectoryPicker !== 'function') return pickWithInput();
      let handle;
      try {
        handle = await root.showDirectoryPicker({ id: 'xiaoxin-article-folder', mode: 'read' });
      } catch (error) {
        if (error?.name === 'AbortError') return;
        return pickWithInput();
      }
      try {
        await memory.saveLastFolder(store, handle).catch(() => {});
        await loadFromHandle(handle);
        await refreshRestore();
      } catch (error) { fail(error); }
    }

    async function resumeFolder() {
      try {
        const record = await memory.loadLastFolder(store);
        if (!record) { state.restore = { action: 'none' }; render(); return; }
        // Called directly from the click handler so Chrome can show its permission prompt.
        const permission = await memory.ensureReadPermission(record.handle, { request: true });
        state.restore = memory.restoreState(record, permission);
        if (permission !== 'granted') throw new Error(t('permissionLost'));
        await loadFromHandle(record.handle);
        await refreshRestore();
      } catch (error) { fail(error); }
    }

    async function runCheck() {
      const bundle = state.bundle;
      if (!bundle) return;
      state.busy = true;
      state.error = '';
      state.notes = [];
      setState('loading', t('checking'));
      render();
      try {
        const markdown = deps.getMarkdown();
        const options = deps.getImportOptions();
        const parsed = shared.parseMarkdown(markdown, { ...options, setCover: true });
        let report = bundleApi.inspect(bundle, parsed, shared, options);
        const byPath = new Map(report.files.map((item) => [item.path, item]));
        const plan = imageApi.planCompression(report.files.map((item) => ({ id: item.path, bytes: item.bytes, type: item.type })));
        for (const item of report.files) {
          const existing = bundle.override(item.file);
          if (existing && existing.target !== plan.targets.get(item.path)) bundle.setOverride(item.file, undefined);
        }
        const jobs = [...plan.targets].filter(([path, target]) => bundle.override(byPath.get(path).file)?.target !== target);
        let index = 0;
        for (const [path, target] of jobs) {
          index += 1;
          const item = byPath.get(path);
          setState('loading', t('compressing', { index, total: jobs.length, name: baseName(path) }), `${fmt(item.bytes)} → ≤ ${fmt(target)}`);
          try {
            const result = await imageApi.compressImage(item.file, target);
            if (result) bundle.setOverride(item.file, { ...result, target });
          } catch (error) {
            state.notes.push({ tone: 'warn', text: `${baseName(path)}: ${error.message}` });
          }
        }
        report = bundleApi.inspect(bundle, parsed, shared, options);
        const compressed = report.files.filter((item) => bundle.override(item.file));
        if (compressed.length) {
          const before = compressed.reduce((sum, item) => sum + item.bytes, 0);
          const after = compressed.reduce((sum, item) => sum + bundle.override(item.file).bytes, 0);
          state.notes.push({ tone: 'ok', text: t('compressedNote', { count: compressed.length, before: fmt(before), after: fmt(after) }) });
        }
        for (const item of compressed) {
          const info = bundle.override(item.file);
          if (info.bytes > imageApi.LIMITS.singleTarget) state.notes.push({ tone: 'warn', text: t('notReached', { name: baseName(item.path), bytes: fmt(info.bytes) }) });
        }
        for (const path of plan.largeGifs) state.notes.push({ tone: 'warn', text: t('gifNote', { name: baseName(path), bytes: fmt(byPath.get(path).bytes) }) });
        for (const item of report.files.filter((item) => item.type === 'image/gif' && !plan.largeGifs.includes(item.path))) {
          state.notes.push({ tone: 'ok', text: t('gifKept', { name: baseName(item.path), bytes: fmt(item.bytes) }) });
        }
        if (plan.impossible) state.notes.push({ tone: 'error', text: t('impossible', { bytes: fmt(plan.fixedBytes) }) });
        state.report = report;
        state.checkedCover = options.setCover;
        state.stale = deps.getMarkdown() !== markdown;
        state.busy = false;
        render();
        if (state.previewed && !els.previewBox.hidden) showPreview();
        return isOk() && !state.stale;
      } catch (error) {
        fail(error);
        return false;
      }
    }

    function urlFor(file) {
      const blob = state.bundle.effective(file);
      if (!state.urls.has(blob)) state.urls.set(blob, URL.createObjectURL(blob));
      return state.urls.get(blob);
    }

    async function showPreview() {
      if (!state.bundle || !isOk() || state.stale || state.busy) return;
      const version = ++state.previewVersion;
      const markdown = deps.getMarkdown();
      const options = deps.getImportOptions();
      const parsed = shared.parseMarkdown(markdown, options);
      const tableImages = new Map();
      try {
        // Use the exact table-to-PNG renderer used by the X write pipeline.
        for (const segment of parsed.segments.filter((s) => s.type === 'table')) {
          const image = await shared.renderTableImage(segment);
          tableImages.set(segment, `data:${image.mime};base64,${image.base64}`);
        }
      } catch (error) {
        if (version === state.previewVersion) fail(error);
        return;
      }
      if (version !== state.previewVersion || deps.getMarkdown() !== markdown || state.busy) return;
      const labels = Object.fromEntries(['coverKept', 'titleKept', 'noCover', 'noTitle', 'missingImage', 'remoteImage', 'tableNote', 'tweet']
        .map((key) => [key, t(key)]));
      const { html } = preview.renderArticlePreview(parsed, {
        setTitle: options.setTitle !== false,
        setCover: options.setCover !== false,
        tableFor: (segment) => tableImages.get(segment),
        labels,
        imageFor: (source) => {
          if (!shared.isLocalImageSource(source)) return { url: '', external: true };
          try {
            const file = state.bundle.resolve(source);
            return file ? { url: urlFor(file) } : null;
          } catch { return null; }
        }
      });
      els.previewBody.innerHTML = html;
      els.previewBox.hidden = false;
      state.previewed = true;
      render();
    }

    function bind() {
      els.pick.addEventListener('click', pickFolder);
      els.resume.addEventListener('click', resumeFolder);
      els.forget.addEventListener('click', async () => {
        await memory.forgetLastFolder(store).catch(() => {});
        state.restore = { action: 'none' };
        render();
      });
      els.recheck.addEventListener('click', runCheck);
      els.previewBtn.addEventListener('click', async () => { await showPreview(); els.previewBox.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      els.previewClose.addEventListener('click', () => { state.previewVersion += 1; els.previewBox.hidden = true; render(); });
      els.goWrite.addEventListener('click', () => deps.focusWrite());
      const onOption = async () => {
        await deps.setImportOptions({ setTitle: els.titleOpt.checked, setCover: els.coverOpt.checked });
      };
      els.titleOpt.addEventListener('change', onOption);
      els.coverOpt.addEventListener('change', onOption);
    }

    bind();
    render();
    refreshRestore();

    return {
      // Another Markdown source replaced the article folder.
      reset() {
        revokeUrls();
        Object.assign(state, { bundle: null, report: null, notes: [], stale: false, previewed: false, written: false, error: '', busy: false });
        els.previewBox.hidden = true;
        render();
      },
      markStale() {
        if (!state.bundle || state.stale) return;
        state.stale = true;
        state.previewVersion += 1;
        state.previewed = false;
        state.written = false;
        els.previewBox.hidden = true;
        render();
      },
      optionsChanged() {
        if (state.busy) return;
        if (state.report && state.checkedCover !== deps.getImportOptions().setCover) {
          runCheck();
        } else {
          render();
          if (!els.previewBox.hidden) showPreview();
        }
      },
      markWritten() {
        if (!state.bundle) return;
        state.written = true;
        render();
      },
      render,
      runCheck
    };
  }

  const api = { createBridgePanel, TEXT };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinBridgePanel = api;
})(typeof window !== 'undefined' ? window : globalThis);
