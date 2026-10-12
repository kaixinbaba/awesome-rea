# 访问统计与搜索后台

## TL;DR

**GA4 与 GSC 已接入并上线，GA4 后台真实入账已验证。** GA4 采用明确同意后才加载的 Basic Consent Mode；拒绝不影响目录，页脚可撤回。中英文共用本站独立数据流。GSC 域名所有权已验证，sitemap 已成功抓取、无错误；API 当前报告提交 4 个 URL、indexed 为 0，不能称已收录。

## 资源

| 项目 | 本站对象 |
| --- | --- |
| 正式 origin | `https://awesomerea.com` |
| GA 账号 | `kaixinbaba1002`，`369571703` |
| GA4 属性 | `awesomerea.com`，`558521378`，Standard，Asia/Shanghai，USD |
| Web 数据流 | `awesomerea`，`16113204294`，URL 已核对为正式裸域 |
| Measurement ID | `G-KFLGGK81K8` |
| GSC | `sc-domain:awesomerea.com`，当前账号 `siteOwner` |
| Sitemap | `https://awesomerea.com/sitemap.xml`，四个双语首页／方法页 URL |

后台资源在操作过程中出现后按 ID 查重并复用；没有再次创建同名对象。数据流 URL 从 `www` 修正为正式裸域，增强型衡量已关闭，Google signals 未启用；无额外关联广告账号、GSC 产品关联或 Measurement Protocol Secret。

## 采集与隐私

- 默认不加载 Google 标签、不发送无 Cookie ping；仅正式 origin、有效明确同意且无 DNT/GPC 隐私信号时启用。
- 仅主动上报每个文档一次 `page_view`。GA4 可能生成 `first_visit`、`session_start` 等基础会话事件；不启用增强型点击、滚动、下载、表单或站内搜索采集。
- 页面 URL 去除 query/hash；未知路径映射到本语言 404，避免路径带入个人标识。外部 referrer 仅保留 origin；同站仅保留已知公开页面路径。
- 不传搜索词、业务用户 ID、项目筛选值或广告归因参数。设备与基础会话信息仍由 GA4 处理，不称为匿名、无 Cookie 统计。
- 许可键 `awesomerea.analytics-consent.v1`，至多 180 天；损坏、过期、未来时间或读取失败不授权。写入失败时，仅当前页面明确选择生效。
- GA Cookie 期限 180 天；撤回先禁用本 Measurement ID，再更新 consent、清理本接入的 `_ga`／`_ga_KFLGGK81K8` Cookie，不清理其他站点数据，不刷新页面。
- 撤回、跨标签同步、许可到期或隐私信号变化后阻止继续采集；不能撤回在途请求或删除已发送的历史数据。
- 同意栏非模态，允许与拒绝同等显著；中英文隐私正文和页脚设置同步。无 JS 时不会加载统计。
- 本地和 Pages 预览 origin 永不采集；正式 allowlist 不因测试放宽。Cloudflare RUM 保持原先关闭状态。

## 开发与验证

```sh
npm test
npm run dev
# 另开终端；业务回归默认拒绝统计
npm run test:browser
# 映射正式 origin 到本地 dist 并 mock Google，绝不发送生产测试流量
npm run test:analytics
```

`public/analytics.js` 管理许可与采集，`scripts/build.mjs` 输出双语 UI 和最小 CSP，`scripts/analytics-check.mjs` 验证默认／拒绝、允许／撤回、跨标签、DNT/GPC、损坏／过期／未来许可、不可用存储、脚本拦截与加载中撤回、预览隔离及无 JS。

真实入账必须另用少量有窗口浏览器样本与 GA4 后台回读；网络 204 不能单独证明入账。只保存公开资源 ID、净化后页面位置、事件数量和 Cookie 名称，不保存完整收集请求、客户标识或认证凭据。

## 当前证据

- 2026-10-12：后台 Web stream 详情核对正式 URL、Measurement ID 和增强型衡量关闭；属性 API 核对账号、时区、币种及 Standard 类型。
- GSC API：本站 `siteOwner`；sitemap `lastSubmitted=2026-10-12T14:25:01.709Z`，`lastDownloaded=2026-10-12T14:53:11.118Z`，`isPending=false`，errors/warnings 为 0，submitted=4、indexed=0。界面初始 Couldn't fetch 与 pending 未被误报为终局失败，没有循环重提；最终 API 证明抓取成功。
- GA4 实时报告：发布前事件为 0；验收后 `page_view=5`、`first_visit=3`、`session_start=3`。页面标题维度为英文首页 3、中文方法页 2。这些包含自有验收样本，不当作正常访客或增长成绩。
- 隔离、有窗口 Google Chrome 无 UA 覆盖：默认零 Google 请求；真实点击同意后，首页和中文方法页各收到目标 ID 的 page_view，两个对应请求均 204，URL query/hash 已去除。撤回后 GA Cookie 清零，跨语言导航不再发送。
- 两条 Chrome `ERR_ABORTED` 均通过同一个 Request 对象匹配到已收到的 204，并与后台入账吻合；未全局忽略错误。
- 本地内容／生成产物和 43 项测试通过；32 个 mock-only 统计场景通过、真实 Google 请求为 0；本地和生产各 16 个业务浏览器上下文通过，JS 场景首页／方法页 axe 自动检查零违规。
- 生产 15 个公开产物与 dist 逐字节相同，另验真实双语 404 与原域名 301，共 18 项。CSP 仍无 unsafe-inline／unsafe-eval，其他安全头保持。
- 首次统计验收快照：https://d03d5ba6.awesomerea.pages.dev ，正式入口为 https://awesomerea.com 。该历史快照明确标记 commit-dirty，基线 HEAD 不等于新提交。
- 常规发布现统一为 `push main` → GitHub Actions 验证／构建／自动发布；流水线核对生产 SHA 和公开文件。发布规则见[开发与部署](development.zh-CN.md)，最新运行见 [GitHub Actions](https://github.com/kaixinbaba/awesome-rea/actions/workflows/check.yml)。不再以本机上传但源码未推送作为完整交付。

本轮必要回执位于 `/Users/xunjunjie/.local/state/awesome-rea-analytics-20261012-01a12faf/`；浏览器报告位于本仓库忽略的 `test-results/analytics-20261012-*`。这些本地证据不随 `dist/` 上传。
