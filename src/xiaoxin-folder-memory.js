/* Remembers the last article folder as a File System Access handle in this extension's IndexedDB.
   Only the handle (a browser-managed reference) is stored, never file contents. Chrome decides when
   read access must be re-granted; we ask again only from a user click. */
((root) => {
  const DB_NAME = 'xiaoxin-article-bridge';
  const STORE = 'folder-handles';
  const KEY = 'last-folder';
  const IMPORTABLE = /\.(?:md|markdown|png|jpe?g|webp|gif|avif|bmp|svg|heic|heif|tiff?)$/i;
  const SKIP_DIRS = new Set(['node_modules', '.git', '.obsidian', '.trash']);
  const LIMITS = Object.freeze({ maxFiles: 3000, maxDepth: 6 });

  function idbStore(factory = root.indexedDB) {
    const open = () => new Promise((resolve, reject) => {
      const request = factory.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const run = async (mode, action) => {
      const db = await open();
      try {
        return await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, mode);
          const request = action(tx.objectStore(STORE));
          tx.oncomplete = () => resolve(request.result);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    };
    return {
      get: (key) => run('readonly', (store) => store.get(key)),
      set: (key, value) => run('readwrite', (store) => store.put(value, key)),
      delete: (key) => run('readwrite', (store) => store.delete(key))
    };
  }

  function isDirectoryHandle(handle) {
    return Boolean(handle && handle.kind === 'directory' && typeof handle.values === 'function');
  }

  async function saveLastFolder(store, handle, now = Date.now()) {
    if (!isDirectoryHandle(handle)) throw new Error('Not a folder handle.');
    const record = { handle, name: handle.name, savedAt: now };
    await store.set(KEY, record);
    return record;
  }

  async function loadLastFolder(store) {
    const record = await store.get(KEY);
    return record && isDirectoryHandle(record.handle) ? record : null;
  }

  function forgetLastFolder(store) {
    return store.delete(KEY);
  }

  async function readPermission(handle) {
    if (typeof handle?.queryPermission !== 'function') return 'granted';
    try { return await handle.queryPermission({ mode: 'read' }); } catch { return 'prompt'; }
  }

  // Must be called from a user gesture when request is true; Chrome rejects prompts otherwise.
  async function ensureReadPermission(handle, { request = false } = {}) {
    const state = await readPermission(handle);
    if (state === 'granted' || !request || typeof handle?.requestPermission !== 'function') return state;
    try { return await handle.requestPermission({ mode: 'read' }); } catch { return 'denied'; }
  }

  // UI decision for the "continue last folder" control.
  function restoreState(record, permission) {
    if (!record) return { action: 'none' };
    if (permission === 'granted') return { action: 'ready', name: record.name, savedAt: record.savedAt };
    if (permission === 'denied') return { action: 'denied', name: record.name, savedAt: record.savedAt };
    return { action: 'needs-permission', name: record.name, savedAt: record.savedAt };
  }

  async function collectEntries(directory, limits = LIMITS) {
    const entries = [];
    async function walk(handle, prefix, depth) {
      for await (const child of handle.values()) {
        if (child.kind === 'directory') {
          if (depth >= limits.maxDepth || child.name.startsWith('.') || SKIP_DIRS.has(child.name)) continue;
          await walk(child, `${prefix}${child.name}/`, depth + 1);
        } else if (child.kind === 'file' && IMPORTABLE.test(child.name) && !child.name.startsWith('.')) {
          if (entries.length >= limits.maxFiles) {
            throw new Error(`Folder has more than ${limits.maxFiles} Markdown/image files. Choose the article folder, not the whole vault.`);
          }
          entries.push({ path: prefix + child.name, file: await child.getFile() });
        }
      }
    }
    await walk(directory, '', 0);
    return entries;
  }

  const api = { DB_NAME, STORE, KEY, LIMITS, idbStore, isDirectoryHandle, saveLastFolder, loadLastFolder,
    forgetLastFolder, readPermission, ensureReadPermission, restoreState, collectEntries };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinFolderMemory = api;
})(typeof window !== 'undefined' ? window : globalThis);
