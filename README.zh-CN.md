# Awesome REA

[English](README.md) · **简体中文**

开源逆向工程、独立重实现和兼容替代项目目录，同时收录 [REA](https://github.com/morluto/rea) 工具与资源。**不要求项目使用 REA。**

[中文网站](https://awesomerea.com/zh/) · [推荐项目](https://github.com/kaixinbaba/awesome-rea/issues/new?template=1-project.yml) · [贡献指南](CONTRIBUTING.zh-CN.md)

独立维护的非官方目录。已核对来源，未独立测试所列软件。[网站](https://awesomerea.com/zh/#directory) 提供完整证据、许可与限制说明。

## 项目目录

<!-- catalog:start -->
<!-- Generated from src/projects.json and src/locales by npm run readme. -->

36 个项目与资源 · 6 个分类

### 开发与安全工具

- [OpenBSD netcat 分析](<https://github.com/NullLabTests/OpenBSD_netcat_REA>) — 使用 REA 和 Ghidra 对 OpenBSD netcat 二进制文件进行静态分析。
- [REA — Reverse Engineer Anything](<https://github.com/morluto/rea>) — 用于智能体辅助软件分析的上游命令行与 MCP 工具集。

### 游戏与游戏引擎

- [DX-Ball](<https://github.com/N0zoM1z0/dx-ball>) — 使用 REA 和 Ghidra 进行中的 DX-Ball 重实现，需要原游戏文件。
- [TH04 环形弹幕重实现](<https://github.com/N0zoM1z0/th04>) — 在更大范围的游戏重实现中，针对 TH04 环形弹幕行为开展的 REA 研究。
- [OpenBattlefield2](<https://github.com/Moxnatiy/OpenBattlefield2>) — 尚未完成的 Refractor 2 重实现，含 REA 调查工具，需要原游戏。
- [GunZRs](<https://github.com/OpenRsG/GunZRs>) — Rust 游戏移植，附独立 REA 调查框架，需要原游戏素材。
- [OpenRCT2](<https://github.com/OpenRCT2/OpenRCT2>) — RollerCoaster Tycoon 2 引擎重实现，需要原游戏文件。
- [OpenMW](<https://github.com/OpenMW/openmw>) — Morrowind 引擎与编辑器重实现，需要原游戏数据，模组兼容性各异。
- [OpenTTD](<https://github.com/OpenTTD/OpenTTD>) — Transport Tycoon Deluxe 式运输经营模拟，可选用免费图像、音效与音乐素材。
- [ScummVM](<https://github.com/scummvm/scummvm>) — 为受支持的经典冒险与角色扮演游戏提供替代引擎，通常需要原游戏数据。

### 桌面与效率应用

- [PhotoCraft](<https://github.com/storytold/photocraft>) — 早期测试版的 Rust 图像编辑器，面向 Photoshop 式工作流程，尚不能直接替代专业日常使用。
- [VectorCraft](<https://github.com/storytold/vectorcraft>) — 测试版 Rust 矢量绘图应用，面向 Illustrator 式工作流程。
- [FilmCraft](<https://github.com/storytold/filmcraft>) — 测试版 Rust 视频编辑器，面向 Premiere 式剪辑、调色和音频工作流程。
- [LightCraft](<https://github.com/storytold/lightcraft>) — 测试版 Rust 照片管理与 RAW 处理应用，面向 Lightroom 式工作流程。
- [PdfCraft](<https://github.com/storytold/pdfcraft>) — 测试版 PDF 工具，面向 Acrobat 式阅读、整理、批注和表单工作流程。
- [EffectCraft](<https://github.com/storytold/effectcraft>) — 测试版 Rust 动态图形与合成工具，面向 After Effects 式工作流程。
- [DesignCraft](<https://github.com/storytold/designcraft>) — 测试前期的 Rust 排版与出版应用，面向 InDesign 式工作流程。
- [WordCraft](<https://github.com/storytold/wordcraft>) — 测试版 Rust 文字处理与文档排版应用，面向 Word 式工作流程。
- [DeckCraft](<https://github.com/storytold/deckcraft>) — 测试版 Rust 幻灯片编辑与演示应用，面向 PowerPoint 式工作流程。
- [CADCraft](<https://github.com/storytold/cadcraft>) — 测试前期的 Rust CAD 绘图应用，面向 AutoCAD 式流程；保存可能丢失不支持的图元。
- [GridCraft](<https://github.com/storytold/gridcraft>) — 测试版 Rust 电子表格应用，面向 Excel 式表格、公式和图表工作流程。
- [Wine](<https://github.com/wine-mirror/wine>) — 面向类 Unix 系统的 Windows API 兼容层，应用兼容性各异。

### 音频、硬件与驱动

- [VSL-DSP](<https://github.com/grisuno/VSL-DSP>) — AudioBox VSL 研究及 Linux 工具；REA 参与了特定 DSP 分析。
- [SoundCraft](<https://github.com/storytold/soundcraft>) — 测试前期的 Rust 音频录制、编辑和混音应用，面向 Pro Tools 式工作流程。

### REA 插件、集成与安装分发

- [dsh-mcp-rea](<https://github.com/Ersith/dsh-mcp-rea>) — 社区 MCP 桥接工具，提供精简的 REA 工具集合。
- [REA Investigator](<https://github.com/Devaretanmay/rea-investigate>) — 用于规划、追踪、验证和报告 REA 调查的智能体技能。
- [rea-jev](<https://github.com/juan-viox/rea-jev>) — 带 Jev 证据检查的 REA 插件；会调用外部模型，钩子失败时放行。
- [rea-agents Homebrew 安装配方](<https://github.com/moonfruit/homebrew-tap/blob/main/Formula/rea-agents.rb>) — 上游 rea-agents 软件包的社区 Homebrew 安装配方。

### 教程、案例与资源

- [Notion 剪贴板桥接分析](<https://rea.tools/showcase/notion/>) — 研究 Notion 剪贴板流程的 REA 案例，不是替代应用。
- [Aegis 身份验证器分析](<https://rea.tools/showcase/aegis/>) — 通过 REA 跟踪现有 Aegis Android 应用中验证码生成逻辑的案例。
- [DownUnderCTF 答案校验器分析](<https://rea.tools/showcase/ctf/>) — 使用 REA 分析 DownUnderCTF 逆向赛题的示例。
- [rea-playbook](<https://github.com/jinshi666888/rea-playbook>) — 包含 REA 练习及独立离线演示的 Electron 实操项目。
- [rea-lab](<https://github.com/pablodiazjorge/rea-lab>) — Windows/Ghidra 配置、练习赛题及持续进行的 REA 评估。
- [REA 法语社区指南](<https://github.com/valorisa/Reverse-Engineer-Anything>) — 介绍 REA 概念、配置和调查流程的非官方法语指南。
- [Awesome AI Reverse Engineering](<https://github.com/DiscoverBox/awesome-ai-reverse>) — 收录 REA 的 AI 逆向工具目录，提供中文和英文。
- [Awesome Reverse Engineering](<https://github.com/morluto/awesome-reverse-engineering>) — 由 REA 维护者整理的综合逆向工程工具与学习目录。
<!-- catalog:end -->

## 参与贡献

欢迎通过 [Issue](https://github.com/kaixinbaba/awesome-rea/issues/new?template=1-project.yml) 推荐项目，或直接提交 PR。支持中文和英文，收录要求见[贡献指南](CONTRIBUTING.zh-CN.md)。

[开发说明](docs/development.zh-CN.md) · [收录方法](https://awesomerea.com/zh/method/) · [MIT 许可证原文](LICENSE)

所链接的项目和素材保留各自许可。品牌名、命令、技术标识及原始来源链接不作翻译。
