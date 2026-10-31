# Xiaoxin Article Bridge

Import a Markdown article folder with local images into X Articles drafts. Check assets, compress oversized images locally and preview the result before writing. The title and cover already set in X are preserved by default, and nothing is ever published automatically.

[中文](README.zh-CN.md) | [Privacy](docs/privacy.md) | [Usage](docs/usage.md) | [Releases](https://github.com/labixiaoxins/xiaoxin-article-bridge/releases)

Chrome Web Store status: **Not yet published**. No official store listing for this fork exists yet.

## What is it?

A free, open-source Chrome Manifest V3 extension for writers who prepare Markdown outside X, including Markdown written in Obsidian. It is an independent fork of xPoster by [@xiaoxiaodong01](https://x.com/xiaoxiaodong01), not an official X, Google or Obsidian product. The original upstream repository (github.com/nevertoday/xposter) is no longer reachable (404 when checked on 2026-10-31). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Folder import

1. Download and unzip the release; in chrome://extensions enable Developer mode and choose Load unpacked. Disable other xPoster variants while using this fork.
2. Follow the step bar in the side panel: **Folder → Check → Preview → Write draft**. Choose a directory containing article.md and its assets folder.
3. Review the check list (status and size of every image; compressed images show before → after).
4. Open the preview to confirm title, cover, body, image positions and tables.
5. Write to the X draft, inspect it on X, then publish manually.

A single root article.md wins over other Markdown files; otherwise only one Markdown file may be present. Relative paths are resolved from the article directory.

## New in 1.1

- **Remember the last folder.** The folder is stored as a File System Access handle in the extension's IndexedDB. After reopening the side panel, click “Continue last folder”; Chrome may ask to re-grant read access. “Forget” removes it.
- **Local compression of oversized images.** When an image exceeds 5 MiB or referenced images exceed 24 MiB in total, images are re-encoded locally with OffscreenCanvas (aspect ratio kept, long edge at most 4096 px, WebP when transparent, otherwise JPEG, decreasing quality). Sizes before and after are shown. Original files are never modified; compressed copies live in memory only. GIFs are not compressed (animation would be lost); oversized GIFs get a warning.
- **Preview before writing.** An approximate X Articles view of title, cover, body, image positions and tables. Parsing, text formatting and table-to-PNG rendering are shared with the write pipeline. X decides the final layout.
- **Obsidian image embeds.** `![[image.png]]`, `![[image.png|300]]` (also inside a sentence) and `cover: "[[cover.png]]"` properties. Lookup order: same folder → assets/ → a unique file with that name anywhere in the chosen folder. Width hints are ignored because X Articles has no custom image widths.
- **Redesigned side panel** with a warm paper theme, outlined cards, a clear step bar and complete empty/loading/error/done states.

## Limits

PNG, JPEG, WebP and GIF; up to 24 MiB of referenced local images (after compression), a local hard ceiling of 16 MiB per image, and 512 KiB of Markdown. Folder scanning stops at 3000 Markdown/image files and skips `.obsidian`, `.git` and `node_modules`; choose the article folder, not the whole vault. The 5 MiB threshold is a conservative guideline, and X's real limits may change. Without the File System Access API the panel falls back to a plain directory picker and cannot remember the folder. Tables are written as images. Remote images require optional host permissions. Article publishing access is determined by X, not this extension.

## FAQ

**Why do images disappear when pasting Markdown into X Articles?** Local paths are not uploaded just because text is pasted. This tool resolves selected local files, prepares image payloads and uses the upstream importer to insert them.

**Does compression change my files?** No. Compressed copies are kept in memory for the current session only.

**Does remembering the folder store my article?** Folder memory stores only a browser-managed directory handle; Chrome controls read access. The editor separately saves draft text locally as described in the privacy policy.

**Does it publish automatically?** No. It prepares the draft; review and publish yourself.

**Is this an Obsidian plugin or a WeChat publisher?** Neither. It reads Markdown folders and targets X Articles. WeChat-specific HTML styling is not preserved.

**Are title and cover overwritten?** No by default. Explicit options can enable those operations.

**Does it need an AI API key?** No. This release imports articles; it does not generate images.

**Does it send content to the developer?** No developer backend or analytics is included. Checking, compression and preview run locally, and the preview does not load remote images. Writing a draft sends selected content to X. Fetching remote images contacts their hosts. See the privacy policy for local retention.

## Development and evidence

Node.js 22 and jq are required for `npm run verify`. This runs upstream static/smoke checks plus unit tests for folder import, Obsidian syntax, compression planning, folder memory and preview rendering. The isolated-browser test `scripts/test-local-extension.cjs` (install Playwright separately or set PLAYWRIGHT_MODULE) walks folder → check → compression → preview → reopen/continue with public synthetic fixtures. `node scripts/test-native-folder.cjs` additionally opens the real desktop folder picker and checks permission recovery after restarting the isolated browser (interactive, choose fixtures/bundle). It blocks external HTTP and does not test live X uploads. `node scripts/package-release.cjs` builds the store/release zip in dist/.

X editor changes may break import. Keep backups and check every imported draft. See [docs/verification.md](docs/verification.md).

## Support

[Issues](https://github.com/labixiaoxins/xiaoxin-article-bridge/issues). Do not attach private drafts, client screenshots, cookies or tokens. MIT licensed; upstream copyright notices are retained.
