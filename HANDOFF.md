# 小新文章桥 v1.1.0 收尾交接

日期：2026-10-31。状态：本地候选完成，未 push、未发 Release、未注册/付款/提交商店、未向真实 X 草稿写入。

## 目标与范围

接续额度中断留下的未提交改动，保留 xPoster 原作者 @xiaoxiaodong01、MIT LICENSE 和 THIRD_PARTY_NOTICES 署名。仅修改本仓库与 `个人网站/research/05-文章桥改造素材/`，未改个人网站 site 或 LibreTV。

## 已做与证据

- 目录句柄保存到扩展 IndexedDB；继续/忘记、Chrome 重新授权、输入目录选择降级。
- 本地图片压缩与前后大小显示，GIF 保留动画并提示。保留已有封面时，闲置封面不占写入/压缩预算。
- 导入前预览复用写入端的解析、正文格式和表格 PNG 渲染；正文编辑使旧预览失效，卡片与设置选项同步。
- Obsidian 图片及宽度语法、同名查找；图片内联替换避开代码/转义/表格示例。
- 暖白/墨色/橙色侧栏、各状态与窄屏检查；修复减少动态效果时上游面板透明的问题。
- 版本与中英文文档、隐私说明、上架清单完成。上游旧地址不可访问的事实按接手资料保留，文档链接到原作者 X 主页。
- `npm run verify`：通过，36 项单元测试、语法/i18n/上游 smoke 通过。
- `npm run test:browser`：隔离 Chrome for Testing 151.0.7922.34 通过，零 pageerror，外部 HTTP 阻断。真实磁盘目录选择、OPFS 句柄恢复、压缩、预览、320/360/420px、明暗主题均通过。
- `node scripts/test-native-folder.cjs`：真实系统目录窗口选择 fixtures/bundle；检查和预览通过；完整重启隔离浏览器后恢复句柄，真实 Chrome 读取权限提示授权后继续成功。未替换原生 picker。
- 日志、截图和浏览器 JSON 回执在 `output/`。更多边界与复现步骤见 `docs/verification.md`。

## 产物

- 上传 ZIP：`dist/xiaoxin-article-bridge-1.1.0.zip`。全部 ZIP 文件已逐个与源文件比对，清单/源码/署名齐全，无测试配置与私人内容。
- 商店截图：`dist/store-assets/` 下 3 张 1280×800 实际浏览器截图。
- 个人网站素材：`个人网站/research/05-文章桥改造素材/`，包括 before/after/preview/table、压缩与各状态截图、README 与验收回执。before 来自已有 v1.0 截图，不需要 stash/worktree。
- 本轮没有安装依赖、收费 API 或遥测；没有读取日常 Chrome 登录资料。

## 仍待小新本人

按 `docs/verification.md` 在自己已登录且有 Articles 权限的 X 上用公开样例验证真实草稿写入（先保留原标题/封面，再在独立测试草稿验证显式替换）。不发布测试文章。之后自行决定 push/Release；如需商店，按 `docs/store-checklist.zh-CN.md` 注册、支付当前页面显示的费用、确认图标和截图、更新公开隐私政策并提交。当前上游图标仍有署名，不作为原创标志宣传。

## 备份与回滚

- 接手基线：`3b70894`（原 v1.0.0）。原有未提交 tracked diff 保存在 `output/handoff-backup/inherited-tracked.patch`；接手时新文件保存在同目录 `inherited-new-files.tar.gz`。不得把它们当作可随意删除的缓存。
- 如要回退试用，Chrome 可重新加载原 `dist/xiaoxin-article-bridge-1.0.0.zip` 的解压目录；保留草稿与现有配置，不清空扩展或浏览器数据。源码回退应在用户授权下针对本次提交操作，不能 reset 用户其他工作。
- 测试只清理自己创建的可丢弃临时 Chrome 配置。没有删除用户数据或旧发布包。

失效条件：X 编辑器变化、Chrome 文件系统权限策略变化，或超出文档的图片/Markdown/文件夹上限。测试成功不代表 X 上传成功或商店审核通过。
