# Contributing to Awesome REA

**English** · [简体中文](CONTRIBUTING.zh-CN.md)

**Recommend open-source reverse-engineering projects, independent reimplementations and compatibility tools. REA usage is not required. English or Chinese is welcome（欢迎中文投稿）.**

## Submit an Issue

- [New project, integration or resource](https://github.com/kaixinbaba/awesome-rea/issues/new?template=1-project.yml)
- [Correction or removal](https://github.com/kaixinbaba/awesome-rea/issues/new?template=2-correction.yml)
- [Website bug](https://github.com/kaixinbaba/awesome-rea/issues/new?template=3-website.yml)

Before submitting, search the [directory](README.md#directory) and existing Issues. Provide a repository or canonical project URL, a specific description, primary evidence of its reverse-engineering/reimplementation/compatibility scope, license, status and limitations. Disclose your relationship to the project. Never submit secrets, private binaries, proprietary investigation data or someone else's personal information.

A link to another directory can help discovery, but it is **not enough evidence for inclusion**. Prefer an author README, source file, commit, writeup or official REA showcase. Link the exact passage; commit-pinned sources are best. Explain what is being analyzed, reimplemented or made compatible. If REA was involved, document its specific role; otherwise do not imply it was used.

## Inclusion rules

| Acceptable | Not sufficient |
| --- | --- |
| Open-source reverse-engineering work, independent reimplementations or compatibility layers | A generic alternative without evidence of the claimed reconstruction or compatibility scope |
| Early/alpha projects with real source and honest limitations | Advertising full parity merely because menus, mockups or a feature checklist exist |
| REA tools, plugins, agent skills, bridges, tutorials and source-backed case studies | A keyword match, unexplained fork or mirror |
| Documented REA involvement, if any, limited to its supported scope | Claiming REA created a project without evidence, or requiring REA use for an otherwise eligible project |

For software, link a clear, applicable open-source license notice. A GitHub repository being public is not a license; an absent or restrictive license may prevent inclusion in the software directory. Public case-study pages can be linked as reading material without implying their target software is openly licensed. Do not label a project a full replacement unless its supported scope and usable build justify that claim.

Flag original assets, commercial dependencies, third-party notices, paid model services, platform limits and unfinished features. Source review is not a legal, security or functional certification. Maintainers can decline irrelevant, insufficiently evidenced or unsafe submissions; listing is free and there is no paid ranking.

## Send a data PR

1. Edit [`src/projects.json`](src/projects.json), not generated HTML. Keep an existing entry's `id` stable so website anchors continue to work.
2. Use the separate purpose, type and project-relationship fields; choose `Independent reimplementation` or `Compatibility project` when appropriate. REA-specific labels are optional and require evidence. Copy the shape of a comparable entry and read the [field reference](docs/development.md#catalog-fields).
3. Set `checked` to the date you actually reviewed the evidence. Do not refresh dates merely because a build ran.
4. Write original, concise descriptions. Do not copy a third-party README wholesale. Preserve scope and uncertainty. Add or update every display field in `src/locales/projects.zh-CN.json`; keep the same ID, rights boundaries and maturity. Review the translation whenever the source changes, then update that entry's `sourceHash` using `sourceHash(project)` from `scripts/i18n.mjs`. Do not refresh a hash without reviewing the translation.
5. Run `npm ci`, `npm run readme`, then `npm test`. Commit the data, translations and both regenerated READMEs together. Do not manually change either README's generated catalog section. Missing or stale translations fail validation.
6. Explain your source review and any untested claims in the PR. UI changes also need [browser checks](docs/development.md#browser-checks).

By contributing original material, you agree to license it under this repository's MIT license. Third-party works keep their own rights; do not submit material you cannot license.

## Review and publication

An Issue is a proposal, not a listing. Maintainers review primary evidence, license scope, duplicates, labels and limits, then merge a focused change. Automated checks catch structural errors and stale generated content, **not factual truth**. They do not install or execute submitted projects.

The README updates when the reviewed change is merged. The website is generated from the same data and is published by the maintainer's manual deployment process; it is not automatically deployed from Issues or unreviewed PRs. There may be a short delay between a merge and the website update.

## Corrections and sensitive requests

Please identify the exact claim and a supporting public source. Removal requests are welcome. If the explanation includes sensitive material, use the maintainer's public [GitHub profile](https://github.com/kaixinbaba) contact rather than posting it in an Issue. Do not publish credentials or private vulnerability details in the public forms.
