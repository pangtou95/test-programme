# Universal Quality Gate

`universal-quality-gate` 是一个产品级质量测试体系模板与 CLI。它不是只测网页，也不是只测网络连接，而是把 Web/浏览器、桌面 App、移动 App、E2E、并发、HTTP 压测、CI 门禁和测试报告组织成一套可复用工程。

## 能不能通过 npm 使用？

可以。发布到 npm 后，别人可以这样使用：

```bash
npm install -D universal-quality-gate
npx quality-test init
npm run quality:doctor
npm run quality:system
```

如果不想安装，也可以：

```bash
npx universal-quality-gate init
```

`quality-test init` 会在对方项目中生成 `quality_test/`，并自动往 `package.json` 写入常用脚本。

## 支持的测试对象

- **Web / 浏览器应用**：官网、后台、SaaS、Web App、H5、管理台。
- **桌面 App**：Electron、Tauri、原生桌面 App，可通过 Playwright Electron 或 custom command 接入。
- **iOS App**：可通过 Maestro、Detox、Appium、xcodebuild 或 custom command 接入。
- **Android App**：可通过 Maestro、Detox、Appium 或 custom command 接入。
- **HTTP 服务**：通过内置 smoke / stress profile 做轻量压测。
- **CI 门禁**：GitHub Actions 模板已内置。

## 核心能力

- `quality-test init`：初始化通用质量测试工程。
- `quality-test doctor`：检查并自动安装缺失测试依赖和 Playwright Chromium。
- `quality-test e2e`：运行 Web/浏览器 E2E。
- `quality-test app`：运行 App adapter 测试命令。
- `quality-test load`：运行 HTTP 压测。
- `quality-test gate`：运行 Web/浏览器质量门禁。
- `quality-test system`：串联 Web、App、Load 的完整质量体系门禁。
- `quality-test summary`：打印最近一次测试摘要。

## 初始化后的目录

```text
quality_test/
  quality-test.config.json
  quality-test.schema.json
  playwright.config.ts
  scripts/
  tests/
    web/
    app/
  specs/
  ci/
  artifacts/
```

## Web / 浏览器测试

模板默认提供：

- smoke：打开入口页，确认页面可见。
- quality：检查无障碍、console error、失败请求、横向溢出、基础性能预算。
- concurrency：多个独立浏览器上下文并发打开产品入口，检查会话稳定性。

Web 配置示例：

```json
{
  "web": {
    "enabled": true,
    "baseURL": "http://127.0.0.1:3000",
    "startCommand": "npm run dev",
    "serverPort": 3000,
    "requiredText": "Dashboard"
  }
}
```

## App 测试

App 测试采用 adapter command 模式，不强行绑定某个生态。高级测试工程里通常会根据项目选择 Maestro、Detox、Appium、xcodebuild 或 Playwright Electron；这个包负责统一调度、门禁和报告。

App 配置示例：

```json
{
  "app": {
    "enabled": true,
    "targets": [
      {
        "name": "ios-smoke",
        "platform": "ios",
        "driver": "maestro",
        "doctorCommand": "npx maestro --version",
        "installCommand": "",
        "startCommand": "",
        "testCommand": "npx maestro test e2e/maestro"
      }
    ]
  }
}
```

这样做的好处是：Web 和 App 可以共用同一套质量门禁，但 App 侧仍然保留各生态最专业的测试工具。

## 压测

默认提供两个 profile：

- `smoke`：适合本地和 CI，默认 8 并发、8 秒。
- `stress`：适合本地/预发更高压力，默认 32 并发、30 秒。

命令：

```bash
quality-test load
quality-test load --profile stress
```

真实环境压测：

```bash
LOAD_TEST_BASE_URL=https://your-domain.com quality-test load
```

注意：只对自己拥有或已获授权的服务压测。

## CI

初始化后会生成：

```text
quality_test/ci/github-actions-quality-test.yml
```

复制到：

```text
.github/workflows/quality-test.yml
```

推荐 CI 命令：

```bash
npm run quality:doctor
npm run quality:system
npm run quality:summary
```

## 发布到 npm

```bash
npm pack --dry-run
npm publish --access public
```

发布前建议确认：

- `package.json` 的 `name` 没有被 npm 占用。
- `version` 已递增。
- `README.md`、`LICENSE`、`bin/`、`templates/` 都在 `npm pack --dry-run` 输出中。
- 不要把项目私密测试产物发布出去。本包通过 `files` 字段只发布 CLI、源码、模板和文档。
