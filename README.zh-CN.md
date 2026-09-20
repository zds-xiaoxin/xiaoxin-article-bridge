# 小新文章桥 · Xiaoxin Article Bridge

将 Markdown 文章和本地配图整包导入 X Articles 草稿，先检查缺图，默认保留已设置的标题与封面。

这是基于 [xPoster](https://github.com/nevertoday/xposter) 的独立开源分支，并非 X、Google、Obsidian 官方产品。保留原作者 [@xiaoxiaodong01](https://x.com/xiaoxiaodong01) 的贡献和 MIT 许可，见 [来源声明](THIRD_PARTY_NOTICES.md)。

**Chrome Web Store：尚未提交，未上架。** 当前从 GitHub Releases 下载解压版，不要把原版商店页面当作本分支的安装入口。

## 适合谁

在 Obsidian 或其他 Markdown 编辑器里写好文章，想将文字和配图搬进 X 长文章草稿的创作者。解决本地图片随复制粘贴丢失、图片目录反复选择及误改已有标题封面的问题。

## 怎么用

1. 解压 Release，在 Chrome 扩展管理开启开发者模式，选择“加载已解压的扩展程序”。其他 xPoster 版本先停用，不必卸载。
2. 点击“导入文章文件夹”，选择包含 article.md 和 assets 的目录。
3. 检查配图列表后写入 X 草稿；再检查图片、表格、标题、封面和保存状态，最后自行发布。

关闭侧栏或重启后需重新选目录。目录导入支持 PNG/JPEG/WebP/GIF，引用的本地图片合计最多 24 MiB，Markdown 最多 512 KiB。不自动发布，不提供 AI 生图，不需要 AI API Key。X 的文章权限由 X 决定。

## 常见问题

- **Obsidian 能直接用吗？** 可以导入合适的 Markdown 导出目录；不是 Obsidian 插件，不会同步整个知识库。
- **能保留公众号所有排版吗？** 不能。它针对 X Articles 的结构化正文，不复制公众号专用 HTML 样式。
- **本地检查通过就代表上传成功吗？** 不代表，必须检查目标草稿。
- **完全不联网吗？** 本地检查不需要开发者服务器；写入时内容会发给 X，远程图片会访问图片网站。
- **有广告或订阅吗？** 此版本没有广告、订阅或开发者遥测。

[隐私说明](docs/privacy.zh-CN.md) · [使用说明](docs/usage.zh-CN.md) · [问题反馈](https://github.com/labixiaoxins/xiaoxin-article-bridge/issues)

本地试用者反馈可用，源码测试及隔离浏览器目录导入测试通过；没有声称对所有账号或未来的 X 页面有效。公开测试素材为人工构造，不包含私人文章或客户图片。
