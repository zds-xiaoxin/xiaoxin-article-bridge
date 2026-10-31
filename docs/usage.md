# Usage

Download the release ZIP, extract it, enable Developer mode at chrome://extensions, and select Load unpacked. Select the folder containing manifest.json. Disable other xPoster variants first to prevent duplicate editor scripts.

The article card at the top of the Pending tab has a step bar: **Folder → Check → Preview → Write draft**.

1. **Folder**: choose the directory containing article.md and assets. Next time the panel opens, “Continue last folder” appears. If Chrome asks to re-grant read access, allow it; after a denial, click again. “Forget” clears the remembered folder.
2. **Check**: each image reference shows its status (ready, missing, unsupported, too large, remote) and size. Images over 5 MiB, or a total over 24 MiB, are compressed locally and shown as before → after. GIFs are not compressed. Click “Check again” after editing the Markdown.
3. **Preview**: an approximate X Articles view of title, cover, body, images and tables. The title/cover replacement toggles update the preview immediately; by default the existing X title and cover are kept.
4. **Write draft**: use “Go to Write” or the Write to X draft button. A passing local check is not upload confirmation; inspect the draft on X. This extension never publishes automatically.

Obsidian embeds `![[image.png]]` and `![[image.png|300]]` are resolved from the same folder, assets/, or a unique file name inside the chosen folder. Width hints are ignored.

X Articles access is a separate requirement managed by X. For errors, provide a small synthetic reproduction to Issues, not your private article, cookies, tokens or full browser profile.
