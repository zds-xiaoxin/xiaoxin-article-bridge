# Chrome Web Store submission packet

Status: NOT SUBMITTED. Developer registration is not complete. This document is preparation, not evidence of approval. Reviewed against official documentation on 2026-09-21.

## Identity and listing

Name: Xiaoxin Article Bridge

Short description: Import Markdown and local images into X Articles drafts. Check missing assets and preserve existing titles and covers.

Category suggestion: Productivity / Tools (choose the closest available category in the dashboard).

English description:

Prepare your article outside X, then bring its Markdown and local images into an X Articles draft. Select a folder containing article.md and assets, review missing-file and file-size checks, and write when ready. Existing titles and covers are preserved by default. Inspect the target draft before publishing manually.

This independent, MIT-licensed xPoster fork focuses on local article packages. It supports suitable Markdown exported from Obsidian and other editors. It is not affiliated with X, Google, Obsidian or the original xPoster publisher. X Articles access is required and is controlled by X. This version does not provide AI image generation or an automatic Publish action.

Draft history and settings are stored locally. Writing transfers selected content to X. Remote images are fetched only from permitted hosts. No developer analytics or developer-operated content server is included. Review the privacy policy for retention details.

中文介绍：

在 Obsidian 或其他 Markdown 编辑器里写好文章后，将文章与本地配图整包导入 X Articles 草稿。选择 article.md 和 assets 所在目录，先检查缺图、路径和文件大小，再执行写入。默认保留 X 中已有的标题和封面，导入后由你检查并手动发布。

本插件是 xPoster 的独立 MIT 开源分支，非 X、Google、Obsidian 官方产品。不提供 AI 生图、不自动发布、不需要 AI API Key。X 文章权限由 X 账号自身决定。目录选择仅当前侧栏会话有效，重启后需重新选择。

## Single purpose

Import user-selected Markdown articles and associated local/remote images into X Articles drafts, with preflight validation and local recovery records for that import.

## Permission justifications

- storage: persist user drafts, preferences, import history and local diagnostics.
- sidePanel: host the Markdown editor and importer without leaving the target article.
- tabs: locate and validate the X Articles target tab; no browsing-history profiling.
- content scripts on X/Twitter: interact with the article editor and its media upload flow.
- optional HTTP/HTTPS hosts: user-specified Markdown may contain images on arbitrary hosts. Request access when needed to fetch those images. No remote executable code is loaded.

## Data disclosure worksheet

Do not tick “no data” just because there is no developer server. Website content includes draft text/media and editor state. Relevant tab URLs and interaction/diagnostic records are accessed/stored locally. Article content is transmitted to X at user request; remote hosts receive image requests. The existing authenticated X session is used. Confirm the live dashboard's current category definitions before submission and ensure choices match docs/privacy.md. Do not claim collection of unrelated history or passwords.

Privacy URL after repository publication: https://github.com/labixiaoxins/xiaoxin-article-bridge/blob/main/docs/privacy.md
Support: https://github.com/labixiaoxins/xiaoxin-article-bridge/issues
Homepage: https://github.com/labixiaoxins/xiaoxin-article-bridge

## Reviewer reproduction

Load fixtures/bundle as the selected folder. Ten references should be found (nine body images plus cover), and title/cover replacement should be unchecked. This is a local preparation test. To test a real import, use the reviewer's own permitted X Articles account and verify the target draft. No developer credentials are supplied or required. Do not publish the test article.

## Remaining submission gates

- Developer account registration, fee payment, email and two-step verification by the owner.
- Confirm listing identity and any required regional trader/contact fields. Never invent those facts.
- Distinctive final icon and required 440x280 promotional image review. Existing upstream icon must not be presented as new original artwork.
- At least one accurate 1280x800 or 640x400 screenshot with only public sample content.
- Privacy form confirmation against current dashboard categories.
- ZIP upload, submission receipt and actual review outcome. Open-source permission does not guarantee store acceptance; a derivative still needs a clear useful difference and non-misleading listing.

## Official references

- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/images
