# 开发与部署

[English](development.md) · **简体中文**

**一份项目数据配合经核对的译文，生成中英文 README 与静态网站。收录开源逆向、独立重实现和兼容项目，不要求使用 REA，无需后端。**

## 本地开发

需要 Node.js 22 或更高版本。

```sh
npm ci
npm run readme
npm test
npm run dev
```

英文预览：`http://127.0.0.1:4387/`；中文预览：`http://127.0.0.1:4387/zh/`。构建输出位于 `dist/`，不提交到 Git。`npm test` 检查数据契约、翻译覆盖、README 一致性、HTML、资源和 SEO 元数据，不安装或运行任何所列第三方软件。

| 路径 | 用途 |
| --- | --- |
| `src/projects.json` | 英文基准数据，统一维护 ID、链接、分类和来源核对日期 |
| `src/locales/en.json`、`src/locales/zh-CN.json` | 界面、元数据、无障碍标签、动态反馈及分类译文 |
| `src/locales/projects.zh-CN.json` | 按相同 ID 组织的中文展示字段，不另存链接或分类 |
| `scripts/i18n.mjs` | 语言注册、完整性／占位符检查与译文过期检测 |
| `scripts/catalog.mjs` | 分类与数据校验 |
| `src/project-covers.json`、`scripts/covers.mjs` | 按项目 ID 组织的可选 README 预览图，校验来源、本地资源和大小 |
| `public/covers/` | 优化后的静态 WebP 预览图与 `NOTICE.txt` 中的第三方来源声明 |
| `scripts/readme.mjs` | 生成和检查两份 README 的目录区块 |
| `scripts/build.mjs` | 生成页面、站点地图、爬虫规则及安全响应头 |
| `public/` | 自有 CSS、JavaScript、站点图标及双语分享图 |
| `.github/ISSUE_TEMPLATE/` | 推荐、纠错／移除和网站问题表单 |
| `.github/workflows/check.yml` | PR 只读检查；`main` 验收产物自动发布到 Pages |
| `scripts/deployment-check.mjs` | 核对生产提交、公开文件、安全头、双语 404 和域名跳转 |

## 目录字段

| 字段 | 含义 |
| --- | --- |
| `id` | 唯一、稳定的小写锚点，不要随意更名 |
| `name`、`url` | 显示名称及当前项目／页面链接 |
| `category` | 用途：`dev-tools`、`games`、`apps`、`hardware`、`integrations`、`learning` |
| `kind` | 类型：`tool`、`reconstruction`、`interoperability`、`integration`、`analysis`、`resource` |
| `relationship` | 来自 `scripts/catalog.mjs` 的关系标签；独立重实现和兼容项目无需 REA 关联，REA 专属标签须有证据 |
| `summary`、`target` | 网站描述及目标／平台背景 |
| `listSummary` | 可选的 README 单句描述，不超过 160 字符；缺省使用 `summary`，不得改变范围和成熟度 |
| `evidence`、`evidenceScope` | 一手 HTTPS 来源及其支持的准确范围，优先完整提交固定链接 |
| `status`、`limitation` | 作者报告的成熟度、关键功能缺口、依赖或证据限制 |
| `license`、`licenseUrl` | 有适用范围的许可标签及原始声明；仅阅读型案例／资源可用 `null`，不能以此收录无许可的软件 |
| `licenseNote` | 可选的素材或第三方许可说明 |
| `secondary`、`secondaryLabel` | 可选辅助来源及链接名称 |
| `checked` | 实际核对来源的日期，格式为 `YYYY-MM-DD`，不可填未来日期 |
| `initial`、`tag`、`tone` | 小图标文字、副标签与 `mint`、`peach`、`lavender`、`sand` 配色之一 |

用途、成果类型、项目关系和成熟度各自独立。早期／测试版可在如实说明限制后收录，不要求使用 REA。空分类不显示；搜索覆盖卡片与展开后的来源文字，用途和类型可组合筛选；禁用 JavaScript 仍可阅读所有条目。

数据或译文变更后运行 `npm run readme`。两份 README 中任一目录未同步，`npm test` 都会失败。只生成注释标记之间的目录，外围文字可直接编辑。

## README 卡片预览图

经核对后选用 README 中第一张合适的头图或截图，不把徽章、小 Logo 或任意图库图片当封面。没有图片的项目使用装饰性占位图；图片加载失败仍保留卡片尺寸和正文。中英共用图片，替代文本和来源标签分别翻译。图片由本站延迟加载，不请求上游图床；构建不联网抓图。

| `src/project-covers.json` 字段 | 含义 |
| --- | --- |
| 项目 ID 键 | 已有稳定目录 ID，不另建项目记录 |
| `src` | `/covers/ID-CONTENTHASH.webp`，取本地文件 SHA-256 的前 12 位 |
| `width`、`height` | 实际图片尺寸，最大 960 × 720；静态 WebP，单张不超过 250 KB |
| `readme`、`source` | 固定提交的 README 来源及原始 HTTPS 图片地址，不保留临时签名参数 |
| `checked` | 实际核对图片及上下文的日期 |

增加封面时，阅读原 README 及适用图片权利说明，缩小但不拉伸或裁掉重要内容，移除元数据，动画只取静态帧；同时补齐映射与 `public/covers/NOTICE.txt` 来源声明。图片保留第三方权利，不通过本目录 MIT 许可再授权，也不能证明软件可用。执行 `npm test`、`npm run test:analytics` 和浏览器检查。校验会拒绝未知 ID、不安全路径、尺寸／哈希不匹配及孤立资源。仅修改封面映射不会改变 README 目录或项目翻译哈希。

## 国际化

英文路径保留 `/`、`/method/`；简体中文使用 `/zh/`、`/zh/method/`。每种语言均有本地化 404、分享图、自指 canonical、双向 `hreflang` 和对应语言的结构化数据。站点地图包含四个可索引页面，404 标记为 `noindex`。

语言切换使用普通链接，无 JavaScript 也能进入对应页面；启用 JavaScript 时还会保留查询参数和锚点。跳转后筛选条件重置。语言切换不记录语言偏好、不写 Cookie、不自动按浏览器语言跳转，也不调用在线翻译服务。可选统计许可独立处理，见[统计接入](ANALYTICS.md)。

所有界面键和项目展示字段必须提供完整译文，不静默回退到英文。品牌名、技术标识、命令及 SPDX 许可标识保留原样。翻译不修改项目 ID、来源链接、分类或核对日期。

英文记录变更会使该条目的翻译哈希失效。先核对中文内容，再用 `scripts/i18n.mjs` 导出的 `sourceHash(project)` 计算并更新 `sourceHash`。哈希只能发现过期，不能证明翻译或事实正确。单条记录核对后可用以下命令取得新哈希：

```sh
node --input-type=module -e "import {loadProjects} from './scripts/catalog.mjs'; import {sourceHash} from './scripts/i18n.mjs'; console.log(sourceHash((await loadProjects()).find(p => p.id === 'photocraft')))"
```

增加语言时，在 `scripts/i18n.mjs` 注册路径与元数据，补齐全部界面、项目译文和 README，并扩充校验及浏览器覆盖。分享图文案改变后运行 `node scripts/social-image.mjs`；图片由本地 HTML 截图生成，不调用生图模型。

2026-10-12 已在生产验证：Cloudflare Pages 对未知路径返回最近的 `404.html`，包括 `/zh/` 下的多级未知路径，均为真实 404 状态及对应语言页面。每次部署后仍需复查，不要添加将未知页面重写为 200 的通配规则。

## 浏览器检查

```sh
npx playwright install chromium webkit
npm run dev
# 另开终端：
npm run test:browser
# 对已部署的网站执行：
TEST_URL=https://awesomerea.com TEST_OUTPUT=test-results/production npm run test:browser
```

检查中英文在 Chromium/WebKit 下的 320–1440px 布局、全部用途／类型组合、中文搜索与重置、锚点恢复、双向语言跳转、Issue 链接、复制成功／失败、封面加载与来源、图片失败时的布局回退、无 JavaScript、双语 404 和自动无障碍规则。业务回归预置拒绝统计，不发送 Google 流量；另用 `npm run test:analytics` 检查完全 mock 的许可、撤回、隐私信号、存储和预览隔离。不等于实体设备测试或全面无障碍认证。报告与截图仅存于被忽略的 `test-results/`。

## 部署

**`push main` 自动上线。** GitHub Actions 校验并构建该提交，运行完全 mock 的统计测试和本地浏览器回归，将验收通过的 `dist/` 交给发布任务，自动部署到既有项目 `awesomerea`。PR 只检查，不取得发布凭据；生产发布串行执行，防止旧任务覆盖新版本。浏览器检查使用固定摘要的官方 Playwright 镜像；升级 Playwright 锁文件时同步镜像版本，保证浏览器及字体环境可复现。

提交已核对的改动后执行：

```sh
git push origin main
```

等待 [Check and deploy website 流水线](https://github.com/kaixinbaba/awesome-rea/actions/workflows/check.yml) 成功。最后一步核对 Cloudflare 生产提交等于该次流水线 SHA、公开文件逐字节匹配验收产物，并复查安全头、双语 404 与旧域 301。仅 push 成功或上传成功不等于验收完成。回滚也通过经核对的 `main` 撤销提交发布。

仓库配置：Actions Secret `CLOUDFLARE_API_TOKEN`（专用、限定本账号的 Pages Edit 凭据）及 Variable `CLOUDFLARE_ACCOUNT_ID`。真实凭据不得写入 Git、文档、本地报告或聊天。首次专用凭据于 2027-10-13 到期，需提前在 Cloudflare 续建并替换 Actions Secret；检查任务不会取得该凭据。

既有 Pages 项目仍显示 Direct Upload，因为 Cloudflare 不允许将其原地改成原生 Git 集成；GitHub Actions 提供 `push main` 自动发布，无需重建项目或迁域名。Wrangler 4.135.0 仅是 CI 内部发布步骤，**不再作为本机常规上线命令**。只发布 `dist/`，不上传仓库、私有记录、环境文件或测试产物，不加 `--force`。

生产域名及默认来源为 `https://awesomerea.com`，根域 CNAME 指向 `awesomerea.pages.dev`，域名绑定和 HTTPS 证书由 Cloudflare Pages 管理。构建前可设置 `SITE_URL=https://your-domain.example` 覆盖 canonical、Open Graph 和站点地图来源；构建变量不会自动绑定域名。发布后检查实际文件、响应头、页面行为及域名跳转。

旧域 `awesomerea.pages.dev` 使用 Cloudflare 账号级批量重定向，301 跳转到正式域名，保留路径和查询参数，不影响预览子域。列表为 `awesome_rea_primary_domain`，规则为 `Awesome REA primary domain`。迁移账号时应保留，不能改成会同时影响正式域的通配 `_redirects` 规则。

`awesomerea.com` 的 Cloudflare 实际用户监测（RUM）已关闭，以免注入统计脚本。绑定新域名时需复查；浏览器测试会拒绝意外第三方请求。

搜索词和语言偏好不保存、不上传。只有访客在 `https://awesomerea.com` 明确允许后才加载可选 GA4；默认／拒绝、浏览器隐私信号、本地及预览环境均不发送统计。许可在本地保存至多 180 天，可通过页脚设置撤回。CSP 在原有第一方限制外仅放行所需 Google 标签与接收域。GSC 域名验证及 sitemap 提交独立于浏览器统计；资源 ID、隐私规则和实际验收状态见[统计接入](ANALYTICS.md)。Cloudflare 仍可能处理传输／安全请求元数据；Google、GitHub Issue 和外链适用其目标服务规则。
