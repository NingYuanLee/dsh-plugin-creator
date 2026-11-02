#!/usr/bin/env node
// Scaffold a DSH plugin skeleton per DSH-PLUGIN-REQUIREMENTS §1/§2/§4/§7.
// Usage:
//   node new-plugin.mjs --name dsh-example [--title Example] [--description "..."]
//                       [--dir D:/tools/dsh-plugins/dsh-example] --author <github-user>
//                       [--repo https://github.com/<github-user>/dsh-example]
//                       [--ui] [--private]
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'

const args = process.argv.slice(2)
const flagSet = new Set(args.filter((a) => a.startsWith('--')))
const arg = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback
}

const fail = (msg) => {
  console.error(`new-plugin: ${msg}`)
  process.exit(1)
}

const name = arg('--name')
if (!name) fail('missing --name')
if (!/^dsh-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  fail(`invalid package name "${name}" (expected dsh-<lowercase-kebab>, e.g. dsh-example)`)
}

const title = arg('--title', name)
const description = arg('--description', 'One-line description of what this plugin does.')
const author = arg('--author', process.env.GITHUB_USER)
if (!author) fail('provide --author <github-user> or set GITHUB_USER')
const repo = arg('--repo', `https://github.com/${author}/${name}`)
const withUi = flagSet.has('--ui')
const isPrivate = flagSet.has('--private')
const target = resolve(arg('--dir', `D:/tools/dsh-plugins/${name}`))

if (existsSync(target) && readdirSync(target).length > 0) {
  fail(`target directory is not empty: ${target}`)
}

const files = new Map()

const pkg = {
  name,
  version: '0.1.0',
  description,
  license: 'MIT',
  author,
  type: 'module',
  main: 'src/index.js',
  exports: {
    '.': './src/index.js',
    './locale/*.json': './locale/*.json',
    './icon': './icon.svg',
    './package.json': './package.json',
  },
  files: [
    'src',
    'cordis.patch.yml',
    'locale',
    'icon.svg',
    'SECURITY.md',
    'README.md',
    'README.zh.md',
    'CHANGELOG.md',
    'LICENSE',
  ],
  scripts: {
    check: 'node --check src/index.js',
    test: 'node --test test/*.test.js',
    prepublishOnly: 'npm test && npm run check',
  },
  engines: { node: '>=22.19.0', dsh: '>=0.2.1-rc.2 <0.3.0-0' },
  peerDependencies: {
    '@deepseek-ai/cordis': '~4.0.4',
    '@deepseek-ai/dsh-tools': '>=0.2.1-0 <0.3.0',
  },
  icon: './icon.svg',
  dsh: { manifestVersion: 1, bundle: { patch: './cordis.patch.yml' } },
  keywords: ['dsh', 'dsh-plugin', 'deepseek-harness', 'cordis'],
}

if (withUi) {
  pkg.exports['./client'] = './lib/client.js'
  pkg.files.push('lib/client.js')
  pkg.dsh.client = { platform: 'web', inject: [] }
}

if (isPrivate) {
  pkg.private = true
  delete pkg.publishConfig
} else {
  pkg.repository = { type: 'git', url: `git+${repo}.git` }
  pkg.homepage = `${repo}#readme`
  pkg.bugs = { url: `${repo}/issues` }
  pkg.publishConfig = { registry: 'https://registry.npmjs.org', tag: 'latest' }
}

files.set('package.json', JSON.stringify(pkg, null, 2) + '\n')

files.set(
  'cordis.patch.yml',
  `- insert:\n    - id: ${name}\n      name: ${name}\n`,
)

files.set(
  'src/index.js',
  `import type {} from '@deepseek-ai/cordis'

export const name = '${name}'
export const inject = []

export function apply(ctx) {
  ctx.tools.register({
    name: 'example_tool',
    description: 'Replace with a one-line description of what this tool does.',
    parameters: {},
    async execute() {
      return 'ok'
    },
  })
}
`,
)

files.set(
  'locale/en.json',
  JSON.stringify({ meta: { title, description } }, null, 2) + '\n',
)
files.set(
  'locale/zh.json',
  JSON.stringify({ meta: { title, description } }, null, 2) + '\n',
)

files.set(
  'icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${title}">
  <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.12"/>
  <text x="32" y="41" text-anchor="middle" font-family="system-ui" font-size="26" fill="currentColor">${title.slice(0, 1).toUpperCase()}</text>
</svg>
`,
)

files.set(
  'README.md',
  `# ${title}

${description}

## Install

\`\`\`bash
dsh plugin --profile web add ${name}
\`\`\`

## Compatibility

| Component | Version |
| --- | --- |
| dsh | \`>=0.2.1-rc.2 <0.3.0-0\` |
| Node.js | \`>=22.19.0\` |

## Behaviour

Describe exactly what the plugin does, which tools it registers, what it reads, and what it sends over the network.

## Uninstall

\`\`\`bash
dsh plugin --profile web remove ${name}
\`\`\`

Removing the plugin leaves no data behind.
`,
)

files.set(
  'README.zh.md',
  `# ${title}

${description}

## 安装

\`\`\`bash
dsh plugin --profile web add ${name}
\`\`\`

## 兼容性

| 组件 | 版本 |
| --- | --- |
| dsh | \`>=0.2.1-rc.2 <0.3.0-0\` |
| Node.js | \`>=22.19.0\` |

## 行为

准确描述插件做什么、注册了哪些工具、读取什么、是否联网。

## 卸载

\`\`\`bash
dsh plugin --profile web remove ${name}
\`\`\`

卸载后不保留任何数据。
`,
)

files.set(
  'CHANGELOG.md',
  `# Changelog

## 未发布（Unreleased）

- 初始骨架。
`,
)

files.set(
  'SECURITY.md',
  `# Security

## Reporting

Report vulnerabilities through GitHub Security Advisories or a private issue in ${repo}.

## Scope

- Reads: nothing outside its own package files.
- Network: no outbound requests.
- Credentials: does not read or store credentials.

Adjust the three lines above to match the implementation before publishing.
`,
)

files.set(
  'LICENSE',
  `MIT License

Copyright (c) ${new Date().getFullYear()} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
)

const uiAssertions = withUi
  ? `
test('declares a web client half', () => {
  assert.equal(pkg.dsh.client.platform, 'web')
})
`
  : ''

files.set(
  'test/manifest.test.js',
  `import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const read = (p) => readFileSync(join(root, p), 'utf8')
const pkg = JSON.parse(read('package.json'))

test('declares manifest v1 with a bundle patch', () => {
  assert.equal(pkg.dsh.manifestVersion, 1)
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.ok(existsSync(join(root, pkg.dsh.bundle.patch)))
})

test('pins the engines baseline', () => {
  assert.equal(pkg.engines.node, '>=22.19.0')
  assert.equal(pkg.engines.dsh, '>=0.2.1-rc.2 <0.3.0-0')
})

test('keeps official packages in peerDependencies', () => {
  assert.equal(pkg.peerDependencies['@deepseek-ai/cordis'], '~4.0.4')
  assert.ok(pkg.files.includes('SECURITY.md'))
  assert.ok(pkg.files.includes('README.md'))
  assert.ok(pkg.files.includes('CHANGELOG.md'))
  assert.ok(pkg.files.includes('LICENSE'))
})

test('publishes display metadata', () => {
  for (const locale of ['en', 'zh']) {
    const meta = JSON.parse(read(\`locale/\${locale}.json\`)).meta
    assert.ok(meta.title)
    assert.ok(meta.description)
  }
  assert.ok(existsSync(join(root, 'icon.svg')))
})

test('registers the row under the package name', () => {
  assert.match(read('cordis.patch.yml'), new RegExp(\`id: \${pkg.name}\`))
  assert.match(read('README.md'), new RegExp(\`add \${pkg.name}\`))
})
${uiAssertions}`,
)

if (withUi) {
  files.set(
    'lib/client.js',
    `// Prebuilt client bundle. Replace with the real build output and keep it in sync
// in CI: "npm run build" then "git diff --exit-code -- lib/client.js".
export const name = '${name}'

export function apply() {
  // Register the client half here.
}
`,
  )
}

if (!isPrivate) {
  files.set(
    '.github/workflows/ci.yml',
    `name: CI

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
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci --ignore-scripts
      - run: npm test
      - run: npm run check
      - run: npm pack --dry-run
`,
  )
}

for (const [rel, content] of files) {
  const full = join(target, rel)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf8')
}

const listed = [...files.keys()].sort()
console.log(`created ${listed.length} files under ${target}`)
for (const rel of listed) console.log(`  ${rel}`)
console.log('')
console.log('next:')
console.log(`  cd ${target}`)
console.log('  npm test')
if (!isPrivate) console.log(`  npm publish --tag latest   # after the pack check passes`)
console.log('  then work through §10 of the dsh-plugin-creator skill checklist')
