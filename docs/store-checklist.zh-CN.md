# 上架 Chrome 商店清单（小新本人操作）

状态：**未注册、未提交**。本清单只是准备材料，不代表已通过审核。官方页面于 2026-10-31 复核（注册页、图片规格页、隐私设置页）。英文提交材料见 [store-submission.md](store-submission.md)。

## 1. 小新需要亲自完成的事

| 事项 | 说明 |
| --- | --- |
| 注册开发者账号 | 打开 Chrome Web Store 开发者控制台，用一个 Google 账号注册。官方建议使用**专门用于发布**的新邮箱；注册后邮箱**不能更改**。 |
| 支付注册费 | 一次性费用，由小新本人支付。小新掌握的金额为 5 美元；官方注册页只写了“一次性注册费”，没写金额，以付款页显示为准。 |
| 同意开发者协议与政策 | 注册时勾选，代理不能代签。 |
| 账号安全与身份信息 | 按控制台提示完成两步验证、邮箱验证、发布者名称，以及欧盟要求的“交易者 / 非交易者”声明等。这些字段按真实情况填写，不要编造地址或公司信息。 |
| 上传与提交 | 上传 `dist/xiaoxin-article-bridge-1.2.0.zip`，填写商品信息和隐私页，点提交。保存提交回执；审核结果以控制台状态为准。 |

代理（Claude/Codex）不注册、不付款、不提交，也不替你点“发布”。

## 2. 需要准备的图片

| 素材 | 规格 | 是否必需 | 当前状态 |
| --- | --- | --- | --- |
| 商店图标 | 128×128 PNG，图形主体约 96×96，四周留 16px 透明边 | 必需 | 已制作 `docs/brand/store-icon-128.png`（96px 主体 + 16px 透明安全边距），由小新过目后使用；扩展包使用 `assets/icon-128.png`。 |
| 截图 | 1280×800 或 640×400，直角、满幅、无留白；至少 1 张，最多 5 张 | 至少 1 张 | 已用公开样例生成草稿：`dist/store-assets/screenshot-1-check-1280x800.png`、`screenshot-2-preview-1280x800.png`、`screenshot-3-table-1280x800.png`。请过目后再用，必要时补一张 X 草稿写入后的截图（用测试文章，不要露出账号信息）。 |
| 小宣传图 | 440×280 | 可选（没有时排序靠后） | 已制作 `docs/brand/promotional-440x280.png`，由小新过目后使用。 |
| 大横幅 | 1400×560 | 可选（没有就不会进首页大图推荐） | 未制作。 |

截图里不得出现私人文章、客户图片、账号头像或用户名。

## 3. 商品信息（可直接复制）

- 名称：Xiaoxin Article Bridge（小新文章桥）
- 简短描述（manifest 中已写）：Import Markdown folders and local images into X Articles drafts. Check, compress and preview first; never auto-publishes.
- 详细描述：中英文版本见 [store-submission.md](store-submission.md)。
- 分类：效率工具（Productivity / Tools，按控制台现有分类选最接近的）。
- 主页：https://github.com/zds-xiaoxin/xiaoxin-article-bridge
- 支持：https://github.com/zds-xiaoxin/xiaoxin-article-bridge/issues

描述中需说明：这是 xPoster 的独立分支，非 X、Google、Obsidian 官方产品；不自动发布；不需要 AI API Key。不要写“最好”“官方”、虚构下载量或评价。

## 4. 隐私页（Privacy practices）怎么填

- **单一用途**：把用户选择的 Markdown 文章及其本地/远程配图导入 X Articles 草稿，并在写入前做本地检查、压缩和预览。
- **权限说明**（manifest 里有几项就要写几项）：
  - `storage`：在本机保存草稿、设置、导入记录和诊断信息。
  - `sidePanel`：在侧栏显示导入界面。
  - `tabs`：找到并确认目标 X 文章编辑页，不用于建立浏览画像。
  - X/Twitter 页面脚本：与 X 长文编辑器和图片上传流程交互。
  - 可选 HTTP/HTTPS 网站权限：只在 Markdown 引用了远程图片且用户同意时，下载那张图片。
  - “记住上次的文件夹”使用浏览器文件系统接口，不需要额外 manifest 权限；目录句柄存在扩展自己的 IndexedDB 中。
- **远程代码**：选“否，我不使用远程代码”（No, I am not using remote code）。
- **数据使用**：不要因为没有开发者服务器就勾“不收集任何数据”。按实际情况勾选网站内容（文章文字和图片会在用户点击写入时发送给 X）等类别，并按控制台列出的合规承诺逐项勾选（含 Limited Use 声明，如不出售数据、不用于与单一用途无关的目的）。以控制台当时的分类说明为准，并与隐私政策保持一致。
- **隐私政策链接**：https://github.com/zds-xiaoxin/xiaoxin-article-bridge/blob/main/docs/privacy.md （需先把 1.2 文档 push 到 GitHub，链接内容才是最新版）。

## 5. 提交前自查

- [ ] 小新已在自己登录的 X 账号上，用测试文章验证过 1.2 的“写入草稿”（见 [verification.md](verification.md)），且没有发布测试文章。
- [ ] 已确认 v1.2.0 push 与 Release 上传受理（隐私政策链接依赖它）。
- [ ] 图标、截图已过目，无私人信息。
- [ ] 上传的 zip 是 `npm run verify` 通过后用 `node scripts/package-release.cjs` 生成的版本。
- [ ] 隐私页勾选与 docs/privacy.md 一致。
- [ ] 提交后保存回执；审核被拒时按邮件原因修改，不要用模糊描述绕过。

开源许可允许分支发布，但不保证商店接受；衍生版本需要有清楚的差异（本版：整包导入、缺图检查、本地压缩、预览、Obsidian 语法、记住文件夹）和不误导的描述。

## 官方参考

- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/policies
