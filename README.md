# Test Programme

`test-programme` 是一个面向真实项目的质量测试工具包，可以用同一套 CLI 管理 Web/浏览器、桌面 App、移动 App、E2E、并发、HTTP 压测、CI 门禁和 npm 发布前校验。

它不是一个只测试网络连接的小脚本，而是一套可以发布到 npm、复制到其他项目、接入 GitHub Actions 的产品级质量工程模板。

## npm 包名

推荐包名：

```text
test-programme
```

已在 2026-05-13 验证：

```text
npm view test-programme name version --json
E404 Not Found
```

这表示当时 npm 上还没有注册这个包名。发布时如果 npm 要求 OTP / 2FA 验证码，验证码必须来自你的 npm 账号认证器或邮箱，我不能也不应该替你生成。

## 安装方式

发布到 npm 后，其他人可以这样使用：

```bash
npm install -D test-programme
npx test-programme init
npm run quality:doctor
npm run quality:system
```

兼容命令别名：

```bash
npx quality-test init
```

## 支持的测试对象

- Web / 浏览器：官网、后台、SaaS、H5、仪表盘、管理台。
- 桌面 App：Electron、Tauri、原生桌面程序，或任意自定义测试命令。
- iOS App：Maestro、Detox、Appium、xcodebuild、XcodeBuildMCP，或任意自定义命令。
- Android App：Maestro、Detox、Appium，或任意自定义命令。
- HTTP 服务：带成功率、错误率、RPS、P95、P99 阈值的 smoke / stress 压测。
- CI/CD：GitHub Actions 质量门禁和 npm provenance 发布流程。

## 快速开始

```bash
npx test-programme init
npm run quality:doctor
npm run quality:system
```

`init` 会生成：

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

## CLI 命令

```bash
test-programme init
test-programme doctor
test-programme e2e
test-programme app
test-programme load
test-programme gate
test-programme system
test-programme summary
```

## Web 质量门禁

生成的 Web 测试包含：

- 入口页 smoke test。
- Axe 无障碍检查。
- console error 检测。
- failed request 检测。
- 横向溢出检测。
- 基础浏览器性能预算。
- 多浏览器上下文并发访问。

## App 质量门禁

App 测试采用适配器协议，不假装一个工具能统治所有平台。你可以让它调用 Maestro、Detox、Appium、xcodebuild、Playwright Electron，或者你自己的命令。

示例：

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

这样 Web 和 App 可以进入同一个质量门禁，但每个平台仍然使用自己生态里最专业的测试工具。

## 并发与压测

默认 profile：

- `smoke`：CI 里安全运行的基线压测。
- `stress`：本地或 staging 环境使用的更高压力 profile。

```bash
test-programme load
test-programme load --profile stress
```

真实环境压测：

```bash
LOAD_TEST_BASE_URL=https://your-domain.com test-programme load
```

只对你拥有或明确获准测试的系统运行压测。

## GitHub Actions

模板包含：

```text
quality_test/ci/github-actions-quality-test.yml
```

复制到：

```text
.github/workflows/quality-test.yml
```

推荐 CI 流程：

```bash
npm run quality:doctor
npm run quality:system
npm run quality:summary
```

本仓库自带的 `ci.yml` 使用 `package-lock.json` + `npm ci`，保证 GitHub Actions 安装结果可复现。

## npm 发布

发布前本地检查：

```bash
npm run verify
```

手动发布：

```bash
npm publish --access public --provenance
```

如果使用 GitHub Actions 发布，需要在仓库 Secrets 中配置：

```text
NPM_TOKEN
```

## 许可证

MIT
