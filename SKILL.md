---
name: dsh-plugin-creator
description: >-
  新建、安装、更新、改造或发布自有 DeepSeek Harness（DSH）插件时使用：用 scripts/new-plugin.mjs 一条命令生成插件骨架，
  并按统一规范校验目录布局、package.json 基线、cordis.patch.yml、locale/icon、Web 客户端样式、
  双语 README、测试与 CI、分发与 awesome-dsh-plugin 市场收录。
  用户提到安装或接入本地自有 DSH 插件、新建 DSH 插件、插件规范、发布前检查、市场收录、awesome-dsh-plugin 时使用。
metadata:
  short-description: 创建并规范 DSH 插件
---

# DSH 插件统一要求

本文的 `D:\tools\dsh-plugins` 和 `D:\tools\skills` 是原作者本机示例，不是其他用户的强制路径。使用当前用户指定或已有的插件目录，从本技能目录的 `scripts/` 调用脚手架；未指定插件目录时确认位置。下文提及的具体插件是参考案例，不要求其他用户已有这些仓库。

> 适用：本目录（`D:\tools\dsh-plugins`）下所有新建/维护的 DeepSeek Harness（DSH）插件仓库。
> 基线依据：官方文档优先，其次 awesome-dsh-plugin 的收录条件。两边冲突时按官方写。本目录四个已验收插件（dsh-grok-byapi / dsh-gui-auth-url / dsh-image-viewer-pro / dsh-system-agents-md）只作实现参照。
> 最后更新：2026-10-20（宿主 dsh 0.2.1-rc.2）。

## 0. 一句话标准

**每个插件都必须能被 `dsh plugin add` 安装、通过官方清单与展示规范、带测试与 CI、仓库/包结构一致；发布前必须满足本文件的 MUST 项。**

官方没有“插件审核规范”，也没有官方插件市场；官方只定义打包/安装、format-1 索引、显示元信息与 Web 样式规范。本文件是这三个官方文档的落地版。

官方文档（master，2026-10-18 可读）：

- 打包与安装：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md
- 插件市场（format-1 / Discover）：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md
- 显示元信息：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-package.md
- Web 样式：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/web-styling.md

## 0.1 适用范围与本地私有插件例外

本文件面向“可发布 / 可分发”的插件。仅本机使用、不发布 npm、不进任何市场目录的**本地私有插件**（`package.json` 里 `"private": true`）属于例外，可豁免以下 MUST：

- §2 的 `publishConfig` / `repository` / `files` 白名单；
- §6 的双语 README / SECURITY / CHANGELOG 强制项（可只保留一篇 `README.md`，写清用途、安装方式与回滚）；
- §7 的 CI 与最低测试集（可保留最小自测脚本）；
- §8 分发与版本、§9 市场收录。

以下项**不可豁免**（否则装不上或加载失败）：

- `dsh.manifestVersion: 1`、`dsh.bundle.patch` 存在且可解析；
- `cordis.patch.yml` 行 id/name 与包名一致；
- `locale/en.json` + `locale/zh.json` 的 `meta.title/description`（用于插件列表显示）；
- profile 以 `link:` 安装后，能在干净会话里被 Loader 加载（启动无报错）。

示例：`dsh-system-agents-md`（本地私有：系统提示段 + 静默守卫）即按此例外维护，不发布、不建 CI，只有最小文件布局。

## 0.2 脚手架：一条命令生成骨架

新建插件不要手抄模板，直接用技能自带脚本：

```powershell
node '<本技能目录>\scripts\new-plugin.mjs' `
  --name dsh-example --author '<GitHub 用户名>' --dir '<插件目录>' --title 'Example' --description 'One-line description.'
```

- 可用 `--dir` 指定生成位置；未指定时，Windows 且存在 `D:\tools\dsh-plugins` 时使用该目录，否则使用当前工作目录。
- 用 `--author` 或环境变量 `GITHUB_USER` 指定作者；默认仓库地址由作者和包名组成，也可用 `--repo` 显式指定。生成后核对作者和仓库地址。
- 追加 `--ui` 生成带 `dsh.client` 的 Web 客户端半区；追加 `--private` 生成 `private: true` 的本地私有插件（按 §0.1 豁免 publishConfig/repository/CI）。
- 脚本拒绝非法包名、拒绝写入非空目录；生成后打印后续步骤。
- 生成物已覆盖 §1 目录布局、§2 清单基线、§4 展示元信息、§7 测试与 CI 骨架，之后只需改业务代码与文档。

## 0.3 安装和更新自有插件

安装已有自有插件时先确认目标 DSH 版本、profile、插件来源及现有配置；遵循当前官方安装文档和插件自身说明，选择适用的 `link:`、npm 或其他受支持方式。安装前检查清单、依赖和版本兼容性，保留其他插件配置。安装后在目标 profile 的干净会话中验证加载及核心功能，报告安装位置、版本、验证结果和回滚方式。更新时先检查本地改动、兼容范围与变更，再验证更新结果；无需重新生成插件骨架。

安装普通第三方 DSH 插件时遵循 DSH 自身安装要求；本技能针对自有插件的开发、安装与分发规范，不强制第三方插件满足本目录的项目约定。

## 1. 目录与命名

- 仓库目录：`D:\tools\dsh-plugins\dsh-<功能>`（小写、连字符，如 `dsh-image-viewer-pro`）。
- npm 包名 = 仓库名 = 目录名；Cordis 行 id = 包名。
- 固定文件布局（缺一不可，除非该项注明可选）：

```text
dsh-<name>/
├── package.json
├── cordis.patch.yml
├── src/index.js            # 或 index.js（单文件插件）
├── locale/en.json          # meta.title / meta.description（必需）
├── locale/zh.json          # 中文展示元信息（必需）
├── icon.svg                # 展示图标（必需）
├── screenshots.json        # 有 UI 时必需，1–8 张；纯工具可省略
├── README.md               # 英文主文档
├── README.zh.md            # 中文文档
├── CHANGELOG.md
├── SECURITY.md
├── LICENSE                 # MIT（默认）
├── test/                   # node:test 用例
└── .github/workflows/ci.yml
```

## 2. package.json 基线（MUST）

```jsonc
{
  "name": "dsh-example",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.js",
  "exports": {
    ".": "./src/index.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg",
    "./package.json": "./package.json"
  },
  "files": [
    "src", "cordis.patch.yml", "locale", "icon.svg", "screenshots.json",
    "SECURITY.md", "README.md", "README.zh.md", "CHANGELOG.md", "LICENSE"
  ],
  "engines": {
    "node": ">=22.19.0",
    "dsh": ">=0.2.1-rc.2 <0.3.0-0"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "~4.0.4",
    "@deepseek-ai/dsh-tools": ">=0.2.1-0 <0.3.0"
  },
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "tag": "latest"
  },
  "icon": "./icon.svg",
  "dsh": {
    "manifestVersion": 1,
    "bundle": { "patch": "./cordis.patch.yml" }
  }
}
```

硬性规则：

1. `dsh.manifestVersion` 必须为 `1`；`dsh.bundle.patch` 指向根目录的 `cordis.patch.yml`。
2. 只声明 `dsh.client` 而没有 `dsh.bundle` 的包**不可安装**。
3. `engines.dsh` 用当前已验证的宿主范围；升级宿主并实测后再改。当前统一值：`>=0.2.1-rc.2 <0.3.0-0`。
4. `engines.node` 统一 `>=22.19.0`。
5. 官方 `@deepseek-ai/*` 包一律放 `peerDependencies`，不要放 `dependencies`；不要写精确预发布版本。
6. peer 范围必须带**显式预发布分支**，否则会静默排除所有 rc/alpha 宿主。当前统一值：`>=0.2.1-0 <0.3.0`（cordis 用 `~4.0.4`，schemastery 用 `~3.18.4`，仅在使用时声明）。
7. `files` 用白名单：运行时代码、`cordis.patch.yml`、`locale`、`icon.svg`、`screenshots.json`、README/CHANGELOG/SECURITY/LICENSE。不要漏发资源，也不要把 `test/`、`scripts/`、`.github/`、`node_modules/` 打进包。
8. 不允许安装期构建脚本（`prepare`/`postinstall`）；要发布就发预构建产物（如 `lib/client.js` 提交进仓库）。
9. `repository` 必须指回本仓库；npm 上架后市场靠它关联条目。

## 3. cordis.patch.yml（MUST）

```yaml
- insert:
    - id: dsh-example
      name: dsh-example
```

- 行 `id` 与 `name` 用包名；多组件插件可用子路径（如 `dsh-example/client`），每个子路径都要在 `exports` 中导出。
- 修改后跑 `dsh --profile <测试profile> --dump-config`，确认出现该层且无解析错误。

## 4. 展示元信息（MUST）

`locale/en.json` 与 `locale/zh.json`：

```json
{ "meta": { "title": "Example", "description": "One-line description of what it does." } }
```

- 两处字段都必须非空；官方读取链：locale `meta` → `package.json` 字段 → 包名。
- 图标：根清单 `"icon": "./icon.svg"`，或 `exports["./icon"]`，二选一（建议都写）。
- 插件页/Settings 直接读这些字段，缺失会显示原始包名和占位图。

## 5. Web 客户端（有 UI 时 MUST）

- 声明客户端半区：

```json
"dsh": {
  "client": {
    "platform": "web",
    "inject": ["@deepseek-ai/dsh-client-locale"]
  }
}
```

- 注册 id 必须等于包名（loader 按包名注册；只允许 `/client` 后缀归一化）。
- 样式只读主题 token：`--dsw-*` / `--dsh-*` 语义变量；禁止复制固定色值、禁止写主题选择器（`[data-theme]` 等）、禁止 Tailwind/组件库。
- 浮层表面：`border: 0` + `box-shadow: var(--dsw-elevation-panel|prominent|soft)`；不要把 `--dsw-alias-border-*` 与 elevation 阴影配对。
- 正圆/胶囊：同时写 `corner-shape: round`。
- 保留键盘焦点可见性与 `prefers-reduced-motion` 降级；弹层做焦点陷阱与关闭后焦点归还。
- 菜单/下拉用官方 `Menu` / `MenuSurface`，不要覆盖菜单材质 token。
- 卸载时清理定时器、事件、注入的 style（用 `ctx.effect` 或注册返回的 disposer）。
- 有构建步骤的客户端插件：提交构建产物 `lib/client.js`，CI 里 `build` 后跑 `git diff --exit-code -- lib/client.js` 防漂移。

## 6. 文档（MUST）

- `README.md` 英文主文档 + `README.zh.md` 中文；两边的 `##` 级标题保持一致（本目录可发布插件都按这个规则写了测试；本地私有插件见 §0.1）。
- README 必须含：
  - 一句话价值 + 实际行为（不夸大，与代码一致）；
  - 可复制安装命令：`dsh plugin --profile web add <pkg>`（npm 发布前写 git/tarball 形式）；
  - 兼容表：dsh 范围（与 `engines.dsh` 一致）、Node 范围、已验证宿主版本；
  - 配置/权限/外部服务/已知限制；
  - 卸载与数据保留说明。
- `SECURITY.md`：报告渠道（GitHub Security Advisories 或 issue）、支持范围、权限边界（读什么/不读什么、是否联网、是否读凭据）、数据外发。
- `CHANGELOG.md`：`## 未发布（Unreleased）` + 版本段，按用户可感知变更记录。
- `screenshots.json`（UI 插件）：数组，1–8 张，仓库相对路径，不能以 `/` 开头、不能含 `..`；外部 URL 只接受 GitHub 托管的 https。

## 7. 测试与 CI（MUST）

最低测试集（`node:test` 或 `node --test`）：

1. 清单：`manifestVersion === 1`、`dsh.bundle.patch` 存在、`engines.dsh`/`engines.node` 等于基线。
2. 依赖：官方包 peer 范围等于基线值；`files` 白名单含 `SECURITY.md` / README / LICENSE / CHANGELOG。
3. 展示：`locale/{en,zh}.json` 的 `meta.title/description` 非空；`icon.svg` 存在且大小合理。
4. 安装：`cordis.patch.yml` 行 id/name 与包名一致；README 含安装命令。
5. 打包：`npm pack --dry-run` 的文件清单包含全部运行时/展示资源，且不含 test/scripts/.github。
6. UI 插件额外：注册 id、screenshots.json 合规、样式关键 token 抽查。

CI（`.github/workflows/ci.yml`）：

```yaml
name: CI
on: [push, pull_request]
permissions:
  contents: read
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: ['22.19.0', '24']
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm test
      - run: npm run check        # 语法/类型检查；没有可删
      - run: npm pack --dry-run
```

- 有客户端构建的插件再加：`npm run build` + `git diff --exit-code -- lib/client.js`。
- 测试不依赖网络与真实凭据；凭据相关逻辑用 stub。

## 8. 分发与版本（MUST）

### Git、GitHub 与 npm 的衔接

- 先检查仓库根目录、`git status --short`、当前分支、`git remote -v`、远端更新、发布 workflow 与现有 tags；确认插件仓库、npm 包名及 `package.json` 的 `repository` 指向同一个项目。只暂存本次任务文件，检查 diff 不含凭据、缓存或无关改动，不覆盖用户改动。
- 依 §7 和本节完成测试、构建与打包检查；按 SemVer 更新版本和 CHANGELOG，确保源码、提交的构建产物及打包内容一致。按任务要求提交并推送到确认过的 GitHub 分支，不强推或改写他人历史。
- 在打 tag、推送 tag、创建 Release 或推送会触发发布的分支前，检查实际 GitHub Actions 触发条件及其 npm 发布行为；普通提交、推送、tag 和 npm 发布是不同操作，不能假定某一步必然完成另一项。只有任务授权发布时才触发发布；避免重复发布同一 npm 版本。
- npm 发布或 dist-tag 操作使用 `npm-publish` 技能；核对 registry 实际版本、dist-tag 和 `repository`，令牌不得写入仓库或日志。GitHub Actions secret 与本机令牌分别配置，不假定相通。
- 发布后核对 GitHub 提交/tag/Release 与 npm 版本、产物和预期 dist-tag 对应；按 §9 核验 DSH 官方安装要求及 awesome 收录条件。awesome 索引以 npm `latest` 等数据发现包，提交仓库或 YAML 本身不代表 npm 已发布或索引已更新。记录实际结果及尚待完成的环节。
- 本地私有插件继续适用 §0.1 的发布和市场豁免；需要版本管理时仍检查仓库状态和保护凭据，不因此自动推送或发布。

- 发布方式：npm 公开包（预构建、stable 版本）为第一优先；Git tag + GitHub Release tarball 为回退；git 源码安装仅在仓库自带预构建产物可行。
- 版本：SemVer；`CHANGELOG` 同步；alpha/beta 只用于未完成版本。
- npm 包的 `repository` 必须指回本仓库。
- 打 tag 前：`npm test`、`npm run build`（如有）、`npm pack --dry-run`、`git diff` 全干净。

## 9. 收录

### 官方

- 给插件仓库加 topic [`dsh-plugin`](https://github.com/topics/dsh-plugin)，便于被发现。见[官方 README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md) 的 Community and support。
- Discover 不自带目录。索引格式见[插件市场](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md)。不自建 `market/index.json`。

### awesome-dsh-plugin

可分发插件收录到 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)。

- PR 只新增 `data/plugins/<owner>__<repo>.yml`：`url`、`name`、`category`、`description.en`（`zh` 可选）。一个 PR 最多 3 条。
- 条件：`dsh.bundle`、真实代码、仓库创建满 1 天、仓库 topic `dsh-plugin`、描述与代码一致。维护者会读代码。
- 分类：模型提供方 `model`，界面增强 `ui`，工具 `tools`，主题 `theme`，其余按实际功能选最贴切一类。
- npm 包的 `repository` 必须指回该仓库。format-1 索引是 `https://awesome-dsh-plugin.com/index.json`，只收有 npm 包、版本和发布时间的条目；未发布时只能 git/tarball 安装。版本由目录探测 npm `dist-tags.latest`，不要在 YAML 里写版本。Discover 里使用这份索引。

## 10. 新建插件检查清单（逐项打勾）

> 本清单面向可发布插件；本地私有插件先按 §0.1 豁免，再勾选剩余项。

- [ ] 用 `scripts/new-plugin.mjs` 生成骨架（手工建目录则逐项对照 §1）
- [ ] 目录/包名/行 id 三者一致，仓库放 `D:\tools\dsh-plugins\dsh-<name>`
- [ ] `package.json`：`manifestVersion: 1`、`bundle.patch`、`engines` 基线、peer 基线、`files` 白名单、`icon`
- [ ] `cordis.patch.yml` 行名 = 包名，`dsh plugin add` 实测安装成功
- [ ] `locale/en.json` + `locale/zh.json` 有 title/description；`icon.svg` 存在
- [ ] README 英文 + 中文，含安装命令、兼容表、权限/限制；描述与代码一致
- [ ] `SECURITY.md`、`CHANGELOG.md`、`LICENSE` 齐全
- [ ] UI 插件：`dsh.client` 声明、注册 id = 包名、只用主题 token、screenshots.json 合规
- [ ] 测试覆盖第 7 节最低测试集；`npm test` 全绿
- [ ] CI：Node 22.19 + 24、ubuntu + windows，`npm ci --ignore-scripts` 通过
- [ ] `npm pack --dry-run` 内容正确（含资源、不含开发文件）
- [ ] 版本 stable、`repository` 指回仓库；npm 发布（或 tarball）完成
- [ ] 仓库 topic 含 `dsh-plugin`
- [ ] awesome 条目一个 YAML PR

## 11. 参考实现（本目录，含本地私有插件）

| 插件 | 形态 | 可参考点 |
|---|---|---|
| `dsh-grok-byapi` | LLM provider + Web 客户端 + 构建产物 | 客户端构建与 CI diff、settings 页、凭据、媒体任务、README 双语文档 |
| `dsh-gui-auth-url` | 纯工具（无客户端） | 最小清单、无构建纯 ESM、check-pack 脚本、manifest 测试 |
| `dsh-image-viewer-pro` | 纯 Web 客户端 | 单文件 ESM + `dsh.client`、screenshots.json、CDP 冒烟、样式 token |
| `dsh-system-agents-md` | 本地私有（系统提示段 + 静默守卫） | 宿主级 `agent/pre-step` 注入提醒、文件监听热更新、`private: true` 最小布局（见 §0.1） |

模板片段（复制后改名字即可）：

`src/index.js`

```js
import type {} from '@deepseek-ai/cordis'
export const name = 'dsh-example'
export const inject = []
export function apply(ctx) {
  ctx.tools.register({ name: 'example_tool', description: '…', parameters: {}, async execute() { return 'ok' } })
}
```

`test/manifest.test.js` 骨架：读 `package.json`，断言第 7 节第 1–4 项；`locale` 断言与 README 安装命令断言各一条。

## 12. 常见被拒/踩坑

1. 只写 `dsh.client`、没有 `dsh.bundle` → 官方安装要求不满足，包不可安装。awesome 同样拒收。
2. peer 范围写成 `>=0.2.0-rc.2 <0.3.0`（看似宽）→ 0.2.1 预发布宿主被静默排除，pnpm 报 ERESOLVE。
3. README 描述夸大或与代码不符 → awesome 维护者读码后打回。
4. npm 包 `repository` 与收录仓库不一致 → awesome 无法把 npm `latest` 关联到该仓库。
5. 截图写死第三方图床 → 隐私原因被拒；用仓库相对路径或 GitHub 托管 URL。
6. 打包漏 `SECURITY.md`/`locale`/构建产物 → 装完显示原始包名或直接加载失败。
7. 改 `engines.dsh` 未实测 → 安装门禁拒绝；改范围必须在本机干净 profile 实测。
