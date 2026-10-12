# Awesome REA

**A curated directory for [REA — Reverse Engineer Anything](https://github.com/morluto/rea): projects, integrations, learning resources and evidence-backed case studies.**

[Browse the website](https://awesomerea.pages.dev) · [Suggest a project](https://github.com/kaixinbaba/awesome-rea/issues/new?template=1-project.yml) · [Correct a listing](https://github.com/kaixinbaba/awesome-rea/issues/new?template=2-correction.yml)

REA connects coding agents to software-analysis tools through a CLI and MCP server. This list helps you find useful work around it **without confusing a narrow investigation, a plugin, and a complete software replacement**.

This is an independent community directory, not the official REA project or an endorsement by its authors. Start with [upstream REA](https://github.com/morluto/rea), the [`rea-agents` npm package](https://www.npmjs.com/package/rea-agents), or [official guides](https://rea.tools/guides/) for installation and support.

## What belongs here

- Open-source projects with primary evidence that REA contributed to the stated work.
- Plugins, agent skills, MCP bridges and packaging explicitly integrating REA.
- Public tutorials, investigations and resource lists with a substantive REA connection.
- Existing projects containing REA tooling, **clearly labeled as tooling present**, not assumed to have been built entirely with REA.

Not included: unrelated alternatives, keyword-only matches, unexplained mirrors, download promotions, or software without enough license and provenance information. We do not host third-party binaries or assets, and do not accept secrets or proprietary investigation data.

**Source-checked is not software-tested.** We read the linked primary sources and license notices; we did not independently execute, benchmark or security-audit these projects. Pinned evidence links preserve the reviewed snapshot. Current functionality and compatibility can change.

## How to read the list

Entries are grouped by **what they are for**. Each separately records:

| Dimension | What it tells you |
| --- | --- |
| Purpose | Developer/security tools; games/engines; desktop/productivity; audio/hardware; integrations/packaging; learning/resources. Empty groups are not displayed. |
| Type | Analysis tool, reconstruction, interoperability, integration/packaging, case study, or learning resource. |
| REA relationship | Upstream project, author-documented use, maintainer case study, tooling present, integration/packaging, or learning resource. |
| Status and limits | What is available, what remains incomplete, and what the cited evidence does **not** establish. |
| License and review date | The reviewed license scope and the date sources were checked, not a legal opinion or freshness guarantee. |

A repository's license does not automatically cover the original software, assets, trademarks or data it analyzes. A partial reconstruction is not a full alternative. **We have not confirmed a complete REA-built replacement for a commercial application in this reviewed edition**; that is a limit of this review, not a claim that none exist.

## Directory

<!-- catalog:start -->
<!-- Generated from src/projects.json by npm run readme. -->

**19 entries · 5 populated purpose groups · latest source review: 2026-10-12**

### Developer & security tools

- **[OpenBSD netcat study](<https://github.com/NullLabTests/OpenBSD_netcat_REA>)** — An author-published static investigation of a Linux netcat binary, with REA evidence files, Ghidra findings and cross-checks against standard binary tools.
  - **Type:** Case study. **Status:** Analysis only. **License:** [MIT (analysis) + BSD notice](<https://github.com/NullLabTests/OpenBSD_netcat_REA/blob/cc1870d34e83bad0b8a6ca2489f6fa177efa6a2a/LICENSE>).
  - **REA:** Author documents REA use — [primary evidence](<https://github.com/NullLabTests/OpenBSD_netcat_REA/blob/cc1870d34e83bad0b8a6ca2489f6fa177efa6a2a/README.md>) (checked 2026-10-12). The repository names REA 6.2.0 and Ghidra 12.1.4 and links its raw analysis artifacts. Its reported findings are static, not a runtime test.
  - **Limits:** The target is already open source. This is a research write-up, not a new netcat implementation or proof that a binary is safe.

- **[REA — Reverse Engineer Anything](<https://github.com/morluto/rea>)** — The upstream toolkit connecting coding agents to binary, application and runtime investigations through MCP and a command-line interface.
  - **Type:** Analysis tool. **Status:** Actively developed toolkit. **License:** [MIT](<https://github.com/morluto/rea/blob/ee50ed121e38cc6e1a2ff0dc8b789f15f71c5402/LICENSE>).
  - **REA:** Upstream REA project — [primary evidence](<https://github.com/morluto/rea/blob/ee50ed121e38cc6e1a2ff0dc8b789f15f71c5402/README.md>) (checked 2026-10-12). The upstream README documents rea-agents setup, supported targets, analysis providers and evidence-carrying workflows. This is the original project, not an unofficial mirror.
  - **Limits:** Provider and platform requirements vary. Local analysis does not mean the coding agent's model provider receives no data. Check current upstream requirements.

### Games & game engines

- **[DX-Ball](<https://github.com/N0zoM1z0/dx-ball>)** — From a classic brick-breaker to readable C/C++. Follow a reconstruction workflow that compares recovered functions against the original executable.
  - **Type:** Reconstruction. **Status:** Reconstruction in progress. **License:** [MIT](<https://github.com/N0zoM1z0/dx-ball/blob/ebe3c26fa2e446306057cf5111de119ed44ca184/LICENSE>).
  - **REA:** Author documents REA use — [primary evidence](<https://github.com/N0zoM1z0/dx-ball/blob/ebe3c26fa2e446306057cf5111de119ed44ca184/README.md>) (checked 2026-10-12). The project README describes Codex using REA with Ghidra to inspect and recover functions. The official REA showcase demonstrates the sound-pan calculation.
  - **Limits:** Original game files are required. A matching function is not proof of whole-game equivalence; we have not built or played this project. [Official case study](<https://rea.tools/showcase/dx-ball/>).

- **[TH04 bullet-ring reconstruction](<https://github.com/N0zoM1z0/th04>)** — See how a ring of bullets turns toward the player. A documented REA inspection connects 16-bit instructions with a readable angle calculation.
  - **Type:** Reconstruction. **Status:** REA evidence covers one feature. **License:** [MIT (repository code)](<https://github.com/N0zoM1z0/th04/blob/5eb20beff3ac32de1278326e4195e6809632a4ce/LICENSE>).
  - **REA:** REA maintainer case study — [primary evidence](<https://rea.tools/showcase/th04/>) (checked 2026-10-12). REA's official showcase verifies a focused bullet-ring inspection. The linked repository is a broader game reconstruction; the evidence does not attribute that whole project to REA.
  - **Limits:** Full-game validation has separate open work. The repository requires your own legal game copy; its source license does not cover original game assets. [Repository scope](<https://github.com/N0zoM1z0/th04/blob/5eb20beff3ac32de1278326e4195e6809632a4ce/README.md>).

- **[OpenBattlefield2](<https://github.com/Moxnatiy/OpenBattlefield2>)** — An in-progress reimplementation of the Refractor 2 engine. Its repository includes a REA helper for investigating user-supplied game binaries.
  - **Type:** Reconstruction. **Status:** Research engine; incomplete. **License:** [MIT + third-party notices](<https://github.com/Moxnatiy/OpenBattlefield2/blob/a7ee9aff9b1537dc9c87e77aab32deed753daf9c/LICENSE>).
  - **REA:** REA tooling present — [primary evidence](<https://github.com/Moxnatiy/OpenBattlefield2/blob/a7ee9aff9b1537dc9c87e77aab32deed753daf9c/tools/rea.sh>) (checked 2026-10-12). tools/rea.sh explicitly invokes rea-agents with Ghidra and per-binary snapshots. Tooling presence does not establish that REA produced every engine subsystem.
  - **Limits:** Requires your own Battlefield 2 installation. The checked README lists missing firing, vehicle control and sound. Not a complete free replacement for the game. [Repository scope](<https://github.com/Moxnatiy/OpenBattlefield2/blob/a7ee9aff9b1537dc9c87e77aab32deed753daf9c/README.md>).

- **[GunZRs](<https://github.com/OpenRsG/GunZRs>)** — A Rust game port that reads assets from the user's Steam installation, with a separate REA and Ghidra investigation framework in the repository.
  - **Type:** Reconstruction. **Status:** Port with documented limitations. **License:** [Apache-2.0](<https://github.com/OpenRsG/GunZRs/blob/c6690d112ff9dc5ae5bc96d9ae16d3111af6ec8a/LICENSE>).
  - **REA:** REA tooling present — [primary evidence](<https://github.com/OpenRsG/GunZRs/blob/c6690d112ff9dc5ae5bc96d9ae16d3111af6ec8a/README.md#reverse-engineering-framework>) (checked 2026-10-12). The README documents a target-independent REA framework. It also says game formats were recovered from data files; this does not prove the entire port was made with REA.
  - **Limits:** Requires your own game installation. We have not run it or checked retail feature parity. Included research tools are not an endorsement of every project claim.

### Audio, hardware & drivers

- **[VSL-DSP](<https://github.com/grisuno/VSL-DSP>)** — An open-source hardware project with Linux device detection and DSP parameter tools. REA findings inform a specific part of its vendor-protocol research.
  - **Type:** Interoperability. **Status:** Hardware validation still needed. **License:** [GPL-3.0-or-later\*](<https://github.com/grisuno/VSL-DSP/blob/e619f0877ffca3c183be37cdd9474f2d7e348ad5/LICENSE>).
  - **REA:** Author documents REA use — [primary evidence](<https://github.com/grisuno/VSL-DSP/blob/e619f0877ffca3c183be37cdd9474f2d7e348ad5/README.md#reverse-engineering-with-lazyown-and-rea>) (checked 2026-10-12). The README credits LazyOwn's REA integration and Ghidra for recent vendor-library and DSP findings, not the entire pre-existing driver project.
  - **Limits:** Not a verified replacement for Universal Control. The README identifies hardware fault injection as remaining work for bulk I/O. We have not tested a device. Kernel detector sources declare GPL-2.0-or-later; consult the per-file notices. [License scope](<https://github.com/grisuno/VSL-DSP/blob/e619f0877ffca3c183be37cdd9474f2d7e348ad5/README.md#license>).

### REA plugins, integrations & packaging

- **[dsh-mcp-rea](<https://github.com/Ersith/dsh-mcp-rea>)** — A thin MCP bridge exposing a curated REA tool selection plus a CLI escape hatch for hosts that cannot filter a large tool catalog.
  - **Type:** Integration / packaging. **Status:** Community integration. **License:** [MIT](<https://github.com/Ersith/dsh-mcp-rea/blob/1751d40bf9d37c33f9737ba277293b774f738a31/LICENSE>).
  - **REA:** REA integration / packaging — [primary evidence](<https://github.com/Ersith/dsh-mcp-rea/blob/1751d40bf9d37c33f9737ba277293b774f738a31/README.md>) (checked 2026-10-12). The README documents the REA CLI invocation, selected MCP tools and local bundle integration. It is an adapter around REA, not a replacement analysis engine.
  - **Limits:** Requires REA and any necessary provider. The README warns its PATH fallback uses a shell; review the explicit REA\_ENTRY mode. We did not execute or security-audit it.

- **[REA Investigator](<https://github.com/Devaretanmay/rea-investigate>)** — An agent skill that organizes REA investigations into planning, tracing, verification and reporting, with a local evidence ledger.
  - **Type:** Integration / packaging. **Status:** Community skill. **License:** [MIT](<https://github.com/Devaretanmay/rea-investigate/blob/28eccff25123c597a55944c1b0d8c555d665b7b0/LICENSE>).
  - **REA:** REA integration / packaging — [primary evidence](<https://github.com/Devaretanmay/rea-investigate/blob/28eccff25123c597a55944c1b0d8c555d665b7b0/README.md>) (checked 2026-10-12). The README explicitly identifies the upstream REA CLI as its analysis instrument and documents modality routing and evidence-hash checks.
  - **Limits:** A structured workflow is not a guarantee that an agent's conclusions are correct. Claimed tests and agent compatibility are author-reported, not independently reproduced here.

- **[rea-jev](<https://github.com/juan-viox/rea-jev>)** — A community plugin pairing REA's MCP server with Jev-based routing, tool-call checks and evidence tracking around an agent investigation.
  - **Type:** Integration / packaging. **Status:** Community plugin; advisory gates. **License:** [MIT](<https://github.com/juan-viox/rea-jev/blob/b30536e8b284ceabd8fc3a2d5bcb61630f876ff3/LICENSE>).
  - **REA:** REA integration / packaging — [primary evidence](<https://github.com/juan-viox/rea-jev/blob/b30536e8b284ceabd8fc3a2d5bcb61630f876ff3/README.md>) (checked 2026-10-12). The README documents the bundled REA MCP configuration, investigation skill, hooks and version pin. This is an independently authored integration.
  - **Limits:** Hooks fail open on provider failure. Jev may send excerpts to an external model service and incur charges; thresholds are not a security boundary. We did not install it.

- **[rea-agents Homebrew formula](<https://github.com/moonfruit/homebrew-tap/blob/main/Formula/rea-agents.rb>)** — A community-maintained Homebrew formula for the rea-agents package, hosted in moonfruit's broader tap.
  - **Type:** Integration / packaging. **Status:** Community-maintained formula. **License:** [MIT (formula)](<https://github.com/moonfruit/homebrew-tap/blob/5c022b0a4bdb3961a0a3276b94802e65d3ac57c5/LICENSE>).
  - **REA:** REA integration / packaging — [primary evidence](<https://github.com/moonfruit/homebrew-tap/blob/5c022b0a4bdb3961a0a3276b94802e65d3ac57c5/Formula/rea-agents.rb>) (checked 2026-10-12). Formula/rea-agents.rb points to the upstream REA homepage and npm package. Only this formula is listed, not every package in the tap.
  - **Limits:** Not an official REA distribution. Inspect the pinned formula and download provenance before installing; formula and packaged software have separate licenses.

### Tutorials, case studies & resources

- **[Notion clipboard bridge](<https://rea.tools/showcase/notion/>)** — Trace a copy operation from the page through preload scripts and IPC to the system clipboard, then examine how rich block data stays connected.
  - **Type:** Case study. **Status:** Analysis only. **License:** No standalone code license.
  - **REA:** REA maintainer case study — [primary evidence](<https://rea.tools/showcase/notion/>) (checked 2026-10-12). The official case study shows REA findings for Notion's tab preload, followed by reading the wrappers and receiver in the packaged application.
  - **Limits:** This is not an open-source Notion replacement. No standalone alternative repository is linked by the case study; it is a focused investigation, not a complete app rebuild.

- **[Aegis authenticator study](<https://rea.tools/showcase/aegis/>)** — Follow the methods behind a six-digit login code in a released APK, and see how the time-step rule explains why the code changes every 30 seconds.
  - **Type:** Case study. **Status:** Analysis only. **License:** No standalone code license.
  - **REA:** REA maintainer case study — [primary evidence](<https://rea.tools/showcase/aegis/>) (checked 2026-10-12). The official REA showcase traces code-generation methods in an Aegis release APK. It is an explanation of an existing open-source application.
  - **Limits:** Not a new authenticator, credential-recovery tool or account bypass. The study does not claim to recover another person's login codes.

- **[DownUnderCTF flag checker](<https://rea.tools/showcase/ctf/>)** — A competition-style reverse-engineering example: follow checking functions, translate their constraints into equations and check a solution.
  - **Type:** Case study. **Status:** Analysis only. **License:** No standalone code license.
  - **REA:** REA maintainer case study — [primary evidence](<https://rea.tools/showcase/ctf/>) (checked 2026-10-12). REA's official showcase documents a DownUnderCTF flag-checker investigation and reports checking the solved result with the challenge program.
  - **Limits:** An educational challenge, not a commercial-software alternative. We reviewed the published account and did not rerun the challenge.

- **[rea-playbook](<https://github.com/jinshi666888/rea-playbook>)** — A runnable teaching project with a small Electron target, line-referenced evidence extraction, an MCP probe and a reconstruction exercise.
  - **Type:** Learning resource. **Status:** Published learning project. **License:** [MIT](<https://github.com/jinshi666888/rea-playbook/blob/0ad65a85139025f32402be13ed64c8003e39b00a/LICENSE>).
  - **REA:** REA learning resource — [primary evidence](<https://github.com/jinshi666888/rea-playbook/blob/0ad65a85139025f32402be13ed64c8003e39b00a/README.md>) (checked 2026-10-12). The README names the published rea-agents package, explains its real-analysis path and distinguishes that path from an offline fixture-only demo.
  - **Limits:** The offline demo does not run REA. The no-native-engine claim applies to the JavaScript/Electron path, not arbitrary native binaries. Test claims were not rerun here.

- **[rea-lab](<https://github.com/pablodiazjorge/rea-lab>)** — A Windows-focused REA lab documenting provider setup, isolated MCP registration, seeded challenges and work toward reproducible evaluation.
  - **Type:** Learning resource. **Status:** Research lab in progress. **License:** [MIT code / CC-BY-4.0 text](<https://github.com/pablodiazjorge/rea-lab/blob/20d2ed632e88a8646eb161adc67a0eb5e16dfe00/LICENSE>).
  - **REA:** REA learning resource — [primary evidence](<https://github.com/pablodiazjorge/rea-lab/blob/20d2ed632e88a8646eb161adc67a0eb5e16dfe00/README.md>) (checked 2026-10-12). The README names REA and Ghidra, links Windows verification contributions and separates completed environment work from benchmarks and planned features.
  - **Limits:** The live evidence pane is planned, not delivered. Verification and benchmark claims are author-reported. Targets are limited to authorized exercises and locally built binaries. [Documentation license](<https://github.com/pablodiazjorge/rea-lab/blob/20d2ed632e88a8646eb161adc67a0eb5e16dfe00/LICENSE-CC-BY-4.0>).

- **[REA French community guide](<https://github.com/valorisa/Reverse-Engineer-Anything>)** — An independent French introduction to REA, with setup guidance, an investigation walkthrough, provider explanations and responsible-use context.
  - **Type:** Learning resource. **Status:** Published community guide. **License:** [MIT](<https://github.com/valorisa/Reverse-Engineer-Anything/blob/8fa0f9b13cdc4a22e949eaf381997f63f8cb80e5/LICENSE>).
  - **REA:** REA learning resource — [primary evidence](<https://github.com/valorisa/Reverse-Engineer-Anything/blob/8fa0f9b13cdc4a22e949eaf381997f63f8cb80e5/README.md>) (checked 2026-10-12). The repository explicitly identifies itself as an unofficial educational guide to morluto/rea and says it does not contain REA's own source code.
  - **Limits:** Educational documentation, not an analysis engine or official support channel. REA changes quickly; current upstream instructions take precedence over translated guidance.

- **[Awesome AI Reverse Engineering](<https://github.com/DiscoverBox/awesome-ai-reverse>)** — A categorized list of AI reverse-engineering tools, including REA among agent, CLI and MCP-based investigation options.
  - **Type:** Learning resource. **Status:** Maintained resource list. **License:** [MIT (list)](<https://github.com/DiscoverBox/awesome-ai-reverse/blob/5ecb1408fafa8de078adce9b07e9e4b965618cca/LICENSE>).
  - **REA:** REA learning resource — [primary evidence](<https://github.com/DiscoverBox/awesome-ai-reverse/blob/5ecb1408fafa8de078adce9b07e9e4b965618cca/README.md>) (checked 2026-10-12). The list explicitly links morluto/rea in its agent-platform section. It is a discovery resource that features REA, not a collection of software built with REA.
  - **Limits:** This listing does not endorse every linked tool or transfer their test, safety or license claims. Check the individual upstream projects before use.

- **[Awesome Reverse Engineering](<https://github.com/morluto/awesome-reverse-engineering>)** — A broad tools-and-learning list maintained by morluto, featuring REA alongside resources for binaries, apps, firmware, formats and protocols.
  - **Type:** Learning resource. **Status:** Maintained resource list. **License:** [CC0-1.0 (list)](<https://github.com/morluto/awesome-reverse-engineering/blob/771759da0560a96382c3b8a36113a02051928ebd/LICENSE>).
  - **REA:** REA learning resource — [primary evidence](<https://github.com/morluto/awesome-reverse-engineering/blob/771759da0560a96382c3b8a36113a02051928ebd/README.md>) (checked 2026-10-12). The README features morluto/rea and describes its broader reverse-engineering scope. It is a companion resource list, not evidence that all listed tools use REA.
  - **Limits:** Individual listed projects retain their own licenses and requirements. Inclusion here is not an affiliation or endorsement of Awesome REA by the maintainer.
<!-- catalog:end -->

## Contribute — no code required

1. [Suggest a project](https://github.com/kaixinbaba/awesome-rea/issues/new?template=1-project.yml). Bring its URL, a short description, a primary source showing the REA connection, its license, and known limitations. English or Chinese is welcome.
2. A maintainer checks scope, evidence, duplicate entries and rights. An Issue is a **proposal**, not automatic publication; submitted programs are not automatically executed.
3. Accepted entries are added to [`src/projects.json`](src/projects.json) through a reviewed change. The same data generates this README directory and the static website.

Already comfortable with Git? Send a focused PR following [CONTRIBUTING.md](CONTRIBUTING.md). Please disclose if you maintain or are affiliated with a submitted project. There is no submission fee or paid ranking.

- [Correct or request removal of a listing](https://github.com/kaixinbaba/awesome-rea/issues/new?template=2-correction.yml)
- [Report a website problem](https://github.com/kaixinbaba/awesome-rea/issues/new?template=3-website.yml)
- [Read the curation method](https://awesomerea.pages.dev/method/)

## Maintain the website

One repository, one catalog, two views. The site is static HTML/CSS/JavaScript: no backend, login, database, analytics or automatic scraping. Search stays in the browser.

```sh
npm ci
npm run readme  # regenerate the directory after a data change
npm test        # build, catalog checks, README parity and HTML checks
npm run dev    # local preview
```

See [development and deployment](docs/development.md) for the data fields, browser tests and manual deployment. CI validates changes; it does **not** publish Issue submissions or deploy unreviewed PRs.

## License

Original code and directory descriptions in this repository are [MIT licensed](LICENSE). Linked projects and source documents retain their own licenses; listing them does not relicense them. Use only software and targets you are authorized to inspect.
