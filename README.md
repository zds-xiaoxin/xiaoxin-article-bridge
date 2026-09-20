# Xiaoxin Article Bridge

Import a Markdown article folder with local images into X Articles drafts. Check assets before writing and preserve the title and cover already set in X by default.

[中文](README.zh-CN.md) | [Privacy](docs/privacy.md) | [Usage](docs/usage.md) | [Releases](https://github.com/labixiaoxins/xiaoxin-article-bridge/releases)

Chrome Web Store status: **Not yet published**. No official store listing for this fork exists yet.

## What is it?

A free, open-source Chrome Manifest V3 extension for writers who prepare Markdown outside X, including Markdown exported from Obsidian. It is an independent fork of [xPoster](https://github.com/nevertoday/xposter), not an official X, Google or Obsidian product. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Folder import

1. Download and unzip the release; in chrome://extensions enable Developer mode and choose Load unpacked. Disable other xPoster variants while using this fork.
2. Choose Import article folder / 导入文章文件夹. Select a directory containing article.md and its assets folder.
3. Review local asset checks, connect your X Article draft, and write. Inspect the draft before publishing manually.

The folder importer checks paths, missing images, MIME types and aggregate file size. A single root article.md wins over other Markdown files; otherwise only one Markdown file may be present. Relative paths are resolved from the article directory. Folder selection is session-only and must be repeated after restarting the sidebar.

The directory workflow supports PNG, JPEG, WebP and GIF, up to 24 MiB of referenced local files and 512 KiB of Markdown. Remote images require optional host permissions. Article publishing access is determined by X, not this extension.

## FAQ

**Why do images disappear when pasting Markdown into X Articles?** Local paths are not uploaded just because text is pasted. This tool resolves selected local files, prepares image payloads and uses the upstream importer to insert them.

**Does it publish automatically?** No. It prepares the draft; review and publish yourself.

**Is this an Obsidian plugin or a WeChat publisher?** Neither. It accepts suitable Markdown exports and targets X Articles. WeChat-specific HTML styling is not preserved.

**Are title and cover overwritten?** No by default. Explicit options can enable those operations.

**Does it need an AI API key?** No. This release is for importing articles, not generating images.

**Does it send content to the developer?** No developer backend or analytics is included. Writing a draft sends selected content to X. Fetching remote images contacts their hosts. See the privacy policy for local retention.

## Development and evidence

Node.js 22 and jq are required for `npm run verify`. This runs upstream static/smoke checks and folder-import tests against synthetic public fixtures. An optional isolated-browser test is in scripts/test-local-extension.cjs; install Playwright separately or supply PLAYWRIGHT_MODULE. It blocks external HTTP and does not test live X uploads.

The local pilot was reported usable by its user. That is not a guarantee across accounts or future X versions. X editor changes may break import. Keep backups and check every imported draft.

## Support

[Issues](https://github.com/labixiaoxins/xiaoxin-article-bridge/issues). Do not attach private drafts, client screenshots, cookies or tokens. MIT licensed; upstream copyright notices are retained.
