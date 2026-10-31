# Privacy Policy

Product: Xiaoxin Article Bridge. Effective: 2026-10-31 (version 1.1.0; previous version 2026-09-21).
Maintainer: GitHub account labixiaoxins. Contact: https://github.com/labixiaoxins/xiaoxin-article-bridge/issues (do not post private data).

## Data and purpose

The single purpose is importing user-selected Markdown and related media into X Articles drafts. The extension reads selected/pasted draft text, selected local files, relevant X/Twitter tab URLs and editor state. It stores draft text, settings, local import history and diagnostic records in Chrome extension local storage. The upstream folder workflow may store granted directory handles in IndexedDB. The article-folder workflow (1.1) stores one handle for the last chosen folder in the extension's IndexedDB so it can be reopened; this is a browser-managed reference, not a copy of the files, and Chrome controls whether read access is still granted. Use “Forget” on the article card, or remove the extension's local data, to delete it. Selected file references, locally compressed image copies and preview images are held in memory for the current side-panel session only and are discarded when the panel closes.

Image compression and the preview run entirely in the side panel. The preview shows local images only and does not request remote images.

The extension uses the browser's existing X session to interact with the editor and related X requests. It does not ask for an X password or send authentication information to the developer. Locally displayed diagnostic records may contain draft text, URLs and errors; inspect and redact any exported report before sharing.

## Transfers

When you choose to write into a draft, article text and selected media are sent to X using its editor/upload workflow. When you authorize a remote image host, the extension fetches the referenced image from that host; hosts receive normal network information such as IP address and requested URL. Image requests omit browser credentials. X and image hosts have their own policies.

No developer-operated content server, advertising, data sale or analytics is included in this release. This does not mean that uploading a draft to X is offline or that no data leaves the device.

## Retention and control

Local records remain until cleared using available extension controls or the extension's local data is removed. Export anything you need before removing the extension. Removing it does not delete content already saved on X. Close the sidebar to release the package-selection session and in-memory compressed copies; use “Forget” to delete the remembered folder handle. Revoke optional site access in Chrome's extension settings. Do not import materials you are not permitted to share with X.

## Permissions

- storage: retain draft text, settings and import history locally.
- sidePanel: display the article importer.
- tabs: locate the relevant X editor tab and inspect its URL/state, not to build browsing profiles.
- X/Twitter content-script matches: interact with the target editor.
- optional HTTP/HTTPS host access: fetch images from user-approved hosts referenced by Markdown; not used for remote executable code.

Data use is limited to the disclosed article-import purpose and follows the Chrome Web Store User Data Policy, including Limited Use requirements. No sale, advertising targeting or unrelated profiling is permitted. Changes to behavior require an updated policy and any required consent.
