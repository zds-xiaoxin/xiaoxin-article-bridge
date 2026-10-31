# Changelog

## 1.2.0 - 2026-11-01

- Unify the side panel and diagnostics with Xiaoxin’s warm paper (#fffdf8), ink outlines, orange accents, 20px cards, downward solid shadows and PingFang-first Chinese typography. Warm dark mode uses the same identity.
- Replace inherited launcher icons with new AI-assisted article/bridge/star artwork in 16/32/48/128px; add a padded store icon and a 440×280 promotional tile. Upstream author and license notices remain unchanged.
- Diagnostics follows the saved theme and live system appearance, and no longer shows upstream product branding. Browser coverage now checks all three sidebar tabs and diagnostics at 320/360/420px in light and dark modes, including button clipping and theme synchronization.
- Refresh bilingual README screenshots, canonical repository links and release materials. Package contents are explicitly listed and compared byte-for-byte with source files. Keep local handoff notes out of the tracked release tree.
- Authenticated X draft writing remains an owner-only acceptance step; this release does not claim it has passed.

### 中文

- 侧栏与诊断页统一小新 IP：暖纸色、墨线、橙色、20px 圆角、底部实色阴影和中文字体；深色模式也使用暖色体系。
- 用全新制作的“文章 + 桥 + 星光”图标替换上游图标，提供 16/32/48/128px、商店安全边距图标与 440×280 宣传图；原作者署名及许可保留。
- 诊断页同步已保存主题及系统明暗变化，补齐三种窄屏宽度、所有侧栏页签与诊断页的可读性检查。
- 更新中英 README 截图、仓库链接、发布材料；发布包按清单逐文件核对。本地 HANDOFF 不进入当前发布文件树。
- 真实 X 草稿写入仍待小新本人验证，不发布测试文章。

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
