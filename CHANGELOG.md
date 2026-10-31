# Changelog

## 1.1.0 - 2026-10-31

- Remember the last article folder (File System Access handle in the extension's IndexedDB) and restore it with one click; Chrome's read-permission prompt is shown only from that click. "Forget" clears it. Falls back to the session-only directory picker when the API is unavailable.
- Compress oversized images locally (single image over 5 MiB, or referenced total over 24 MiB) with OffscreenCanvas: aspect ratio kept, long edge capped at 4096 px, WebP for transparent images and JPEG otherwise, decreasing quality then size. The check list shows sizes before and after. GIFs are never re-encoded; oversized GIFs are flagged. Originals are not modified.
- Preview before writing: approximate X Articles rendering of title, cover, body, image positions and tables, using the writer's parser, text-formatting functions and table-to-PNG renderer. Remote images are not loaded in the preview.
- Obsidian image embeds: `![[image.png]]`, `![[image.png|300]]`, inline image embeds and `cover: "[[cover.png]]"`. Resolution order: same folder, assets/, then a unique file name within the chosen folder. Width hints are ignored.
- Redesigned side panel (warm paper theme, outlined cards, step bar Folder → Check → Preview → Write draft, complete empty/loading/error/done states). Title/cover replacement toggles are available on the card.
- Unused covers are excluded from the write/compression budget while the existing X cover is preserved. Editing invalidates old previews; settings and card options stay synchronized. Local package validation runs before any X draft creation.
- Image materialization uses the parser's recognised spans, preserving code examples, escaped syntax and table cells. Reduced-motion mode keeps panels visible instead of leaving the upstream initial opacity at zero.
- Documentation: upstream link now points to the original author's X profile because github.com/nevertoday/xposter returns 404; new Chrome Web Store checklist (docs/store-checklist.zh-CN.md).
- Tests: unit tests for Obsidian parsing/resolution, compression planning, folder memory and preview; isolated-browser walk-through of folder → check → compression → preview → reopen/continue, real desktop folder selection and browser-restart permission recovery. Actual JPEG/WebP encoding, transparency and 320/360/420 px sidebars are checked.

## 1.0.0 - 2026-09-21

- Independent xPoster-derived release with directory-package import.
- Validate local paths, missing files, media types and total referenced bytes.
- Preserve existing title and cover by default.
- Public synthetic fixtures, bilingual documentation and privacy disclosure.
- Chrome Web Store submission pending developer account registration; not listed yet.
