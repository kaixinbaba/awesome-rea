# awesomerea-seo-batch1 交付

- **任务ID**: awesomerea-seo-batch1
- **状态**: 待验收（PR 已开，未合 main）
- **仓**: kaixinbaba/awesome-rea
- **分支**: feat/awesomerea-seo-batch1
- **工作目录**: /workspace/awesome-rea-seo-batch1
- **时间**: 2026-10-22 21:10+ Asia/Shanghai

## 改动摘要

1. **项目页 Title / meta description 模板（中英）**  
   - EN Title: `{name} — {relationship} of {original} | Awesome REA`（relationship 小写；original 取自 target 中 `·` 前段）  
   - ZH Title: `{name} — {original} {relationship} | Awesome REA 条目`  
   - Description：summary + status + Know before you try/使用前请注意（limitation）+ REA 关联说明 + sources checked / 来源复核日期  
   - 约 184 路由（92 条目 × 中英）仅改模板，未灌大词专页

2. **页脚 Partners**  
   - 直接删除 realisticai.io / aitoolcenter.com 及 Partners 区块（HTML + CSS + i18n `footer.partners`）  
   - 与「An independent index」一致，未迁独立说明页

3. **技术小修**  
   - Sitemap `lastmod`：项目页用条目 `checked`；分类页用该分类 max(checked)；首页/method 用全站最新 checked（不再全站同一天）  
   - 项目 JSON-LD：移除误用的 `operatingSystem: p.target`；未加 AggregateRating  
   - 首页 JSON-LD：`@graph` 增加 `WebSite`（name Awesome REA，alternateName awesome-rea）；`og:site_name` 本已有

## 关键文件

- `scripts/build.mjs`
- `scripts/check.mjs`
- `src/locales/en.json`
- `src/locales/zh-CN.json`
- `public/styles.css`

## 自检（合 main 前）

### Title + description 原文

**openblack EN**  
- Title: `openblack — independent reimplementation of Black & White (2001) | Awesome REA`  
- Desc: `An open-source reimplementation of Lionhead’s Black & White (2001) in modern C++ with OpenGL/Vulkan, using original assets extracted from the retail… Status: Actively developed; nightly desktop builds. Know before you try: Original Black & White assets remain copyrighted and are not included. Android/iOS and some cross-compile targets are…. Listed on Awesome REA (Independent reimplementation); REA usage is optional. Sources checked: 2026-10-15.`

**openblack ZH**  
- Title: `openblack — 黑与白（2001） 独立重实现 | Awesome REA 条目`  
- Desc: `Lionhead《黑与白》（2001）的开源重实现，采用现代 C++ 与 OpenGL/Vulkan，使用从零售安装包/补丁提取的原版素材。 状态：活跃开发；桌面夜间构建。使用前请注意：原版《黑与白》素材仍受版权保护且不包含。Android/iOS 及部分交叉编译目标为实验性。可玩完整度取决于原版素材与持续引擎工作。投稿者仅审阅公开 readme/许可；我们未独立测试。收录于 Awesome REA（独立重实现）；是否使用 REA 非收录前提。 来源复核：2026-10-15。`

**CADCraft EN**  
- Title: `CADCraft — independent reimplementation of Autodesk AutoCAD workflows | Awesome REA`  
- Desc: `A Rust CAD application recreating AutoCAD-style drafting, dimensions, layouts and DXF/DWG workflows. Status: Pre-alpha; partial alternative. Know before you try: The roadmap reports incomplete precision drafting, block editing and plot styles. Saving drops entities the app does…. Listed on Awesome REA (Independent reimplementation); REA usage is optional. Sources checked: 2026-10-12.`

**CADCraft ZH**  
- Title: `CADCraft — Autodesk AutoCAD 工作流程 独立重实现 | Awesome REA 条目`

**nv-rs EN**  
- Title: `nv-rs — independent reimplementation of Fallout: New Vegas | Awesome REA`  
- Desc: `A from-scratch reimplementation of Fallout: New Vegas in Rust with Bevy that reads the user’s own Data folder and ports engine behavior toward 1:1 gameplay. Status: Experimental; partial routes playable. Know before you try: Not a full campaign; original saves and NVSE DLLs unsupported; Windows is the tested platform. Original Fallout: New…. Listed on Awesome REA (Independent reimplementation); REA usage is optional. Sources checked: 2026-10-14.`

**nv-rs ZH**  
- Title: `nv-rs — 辐射：新维加斯 独立重实现 | Awesome REA 条目`

### Partners

随机 5 页（awesome-ai-reverse / gridcraft / th04 / meitouclient / opengol）中英 + 首页/method/分类：均无 `footer-partners` / realisticai / aitoolcenter。

### Sitemap lastmod 抽样（非统一构建日）

| URL | lastmod |
|-----|---------|
| /projects/openblack/ | 2026-10-15 |
| /projects/cadcraft/ | 2026-10-12 |
| /projects/nv-rs/ | 2026-10-14 |
| /projects/dx-ball/ | 2026-10-12 |
| /projects/rea/ | 2026-10-12 |

全站 200 条 URL 共 **9** 个不同 lastmod 日期。

### JSON-LD

- 项目页：无 `operatingSystem`、无 `AggregateRating`
- 首页：含 WebSite + ItemList `@graph`；`og:site_name=Awesome REA` 已有

### 本地产物 / 抽查路径

- Build: `npm test` PASS（build + check + 52 unit tests）
- 产物: `/workspace/awesome-rea-seo-batch1/dist/`
- 例: `dist/projects/openblack/index.html`、`dist/zh/projects/openblack/index.html`、`dist/sitemap.xml`

## 阻塞

无。等 CEO PASS 后再合 main / 上线（本单要求先交 PR 待验）。

## PR

（push 后回填）
