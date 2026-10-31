# Release verification

## 1.2.0 local verification — 2026-11-01

Status: local implementation verified; remote connectivity is blocked, so no push or GitHub Release is confirmed. No store submission or authenticated X draft write was performed.

- `npm run verify`: passed, including syntax, JSON/i18n, upstream smoke and 36 unit tests.
- `npm run test:browser`: passed in an isolated Chrome for Testing 151.0.7922.34 profile, with external HTTP blocked and zero page runtime errors. Existing Playwright/browser installations were reused.
- Folder selection, OPFS handle persistence, actual local JPEG/WebP compression, transparency, preview, stale-preview invalidation and metadata-option synchronization still pass. The real native dialog/restart permission flow was previously verified for 1.1; it was not repeated for this visual release.
- Light/dark × 320/360/420px × draft/records/settings/diagnostics: 24 layouts checked for document overflow and clipped button text. Theme settings propagate to diagnostics; both surfaces follow system appearance in system mode.
- Final screenshots use public synthetic fixtures only. Icons and promotional artwork received a production-side visual check; owner visual acceptance and store submission remain separate.
- Packaging explicitly enumerates production files and compares every archived byte with source. Audit is saved alongside the ZIP in `dist/`; tests, local profiles, output evidence and handoff notes are excluded.
- Local logs: `output/verify-v1.2.log`, `output/browser-v1.2.log`; browser receipt: `output/playwright/result.json`. These are ignored and are not part of the release ZIP.

Use the extracted **1.2.0 ZIP** for the owner-only real-X checklist below. Confirm all body images and the table are saved, default title/cover preservation works, explicit replacement works in a separate draft, and never publish the test article. Local checks do not prove X saved a draft.

## Historical 1.1.0 local candidate — 2026-10-31

Status: implemented and verified locally. No push, GitHub Release, store registration/payment/submission, or authenticated X draft write was performed in this work.

- `npm run verify`: passed. Syntax, JSON/i18n and upstream smoke checks plus **36 unit tests** (12 bundle + 24 v1.1 tests).
- `npm run test:browser`: passed in a fresh, disposable **Chrome for Testing 151.0.7922.34** profile. The extension is loaded unpacked; the normal Chrome profile is not used. All external HTTP(S) requests are blocked.
- Real disk directory selection through the browser file chooser: `fixtures/bundle` → check → preview passed. Nine body images and one table render. Title and cover replacement remain off by default.
- Automated handle persistence uses real OPFS directory handles with a substituted picker response; this is distinct from native-picker verification below. Closing/reopening the panel restores its IndexedDB handle and the continue button works.
- `node scripts/test-native-folder.cjs`: passed separately in a headed isolated Chrome. The **actual system directory picker**, without substitution, selected `fixtures/bundle`. Ten references checked, nine body images and the writer-rendered table PNG previewed. After a full browser close/restart, the stored handle remained; “Continue last folder” showed Chrome's actual read-access prompt, permission was granted, and the check passed again.
- Obsidian own-line/inline embeds and width hints passed. Image-like inline/fenced code, escaped examples and table cells stay literal during materialization. Ambiguous duplicate filenames fail rather than guessing.
- Actual local JPEG compression: synthetic random-pixel PNG **17.1 MiB → 4.1 MiB**. Actual WebP compression of a transparent sample kept its 256×128 ratio and alpha channel while reducing bytes. Original fixture files are unchanged.
- Missing-image and unused-cover paths passed. Editing invalidates the old preview. The card and Settings metadata controls stay synchronized. Preview and writing share the parser, text renderers and table-to-PNG function.
- 320, 360 and 420 CSS-pixel sidebars have no document horizontal overflow. Light/dark screenshots inspected. Reduced-motion mode remains visibly rendered (a previously inherited opacity bug was fixed).
- Both browser runs reported **zero page runtime errors**. This is not a claim of universal X compatibility or store acceptance.

### Reproduce

Node.js 22 and jq are used for `npm run verify`. Browser checks need an existing Playwright installation and its Chrome for Testing binary. Either resolve `playwright` normally or set `PLAYWRIGHT_MODULE` to its absolute module path; this work reused the installed environment without adding dependencies to the repository.

```sh
npm run verify
npm run test:browser
# Interactive desktop check: choose fixtures/bundle and allow its read-access prompt.
node scripts/test-native-folder.cjs
npm run package
```

The native check closes its own isolated browser and removes only its disposable test profile. It does not use everyday Chrome login data.

### Evidence and artifacts

- Automated receipt: `output/playwright/result.json`; native receipt: `output/playwright/native-result.json`.
- Static/unit log: `output/verify-v1.1.log`; browser log: `output/browser-v1.1.log`.
- Store screenshot drafts: `dist/store-assets/screenshot-{1-check,2-preview,3-table}-1280x800.png` (actual browser captures; public fixtures only). Review before submitting.
- Store/upload package: `dist/xiaoxin-article-bridge-1.1.0.zip`; LICENSE and THIRD_PARTY_NOTICES are included. Local test profiles, logs, screenshots and website material are excluded.
- Website experiment assets: `个人网站/research/05-文章桥改造素材/` in the parent 自媒体 workspace. Its README describes before/after, image sources and the live-X acceptance gap. The before image was recovered from the existing v1.0 capture `output/playwright/local-bundle.png`; no stash or worktree was needed.

### 小新本人验证真实 X 草稿

1. Keep an article backup. In your Chrome, disable other xPoster variants, then load this repository or the extracted 1.1.0 ZIP with **Load unpacked**. Do not clear your existing Chrome/extension data.
2. Sign in to X yourself with an account that has X Articles access. Create a disposable test draft and set a recognizable title and cover.
3. Select this repository's public `fixtures/bundle` folder. Check the image list, click Preview, and leave both replacement options **unchecked**.
4. Click **Write to X draft**. Confirm all nine body images and the table are present and in order, and that the pre-existing title and cover are unchanged. Do not publish the test article.
5. In a separate disposable draft, explicitly enable title/cover replacement, preview again, and confirm the result on X. Real-X support for these metadata operations still needs this owner check.
6. Close/reopen the sidebar and continue the last folder; if Chrome asks, grant read permission. For a large-image check, use a disposable public copy, confirm before/after sizes, and check its final appearance in the X draft.

Passing local validation, a screenshot or a click is not proof that X saved/uploaded the draft. Record the actual draft result before calling 1.1 accepted for live use.

## Historical 1.0.0 verification — 2026-09-21

- `npm run verify`: passed (upstream syntax/i18n/smoke checks and 12 bundle tests).
- Independent Chrome for Testing profile loaded the extension successfully.
- The browser file chooser selected public `fixtures/bundle`: nine body references plus cover ready, no runtime errors, title/cover replacement off.
- HTTP requests blocked; authenticated X interaction not tested in that run.
- Screenshot: `images/local-bundle.png` (public synthetic data). Store submission not performed.

Original functional upstream checks remain enabled. Targeted package/content inspection does not constitute a comprehensive security audit. Future X editor changes may require maintenance; preview styling is approximate and remote images are not fetched during preview.
