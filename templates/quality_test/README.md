# quality_test 通用质量测试工程

这是由 `test-programme` 生成的产品级质量测试模板，支持 Web/浏览器、桌面 App、移动 App、E2E、并发、压测和 CI 门禁。

## 快速开始

1. 修改 `quality-test.config.json`。
2. 如果是 Web 项目，设置 `web.baseURL` 和可选的 `web.startCommand`。
3. 如果是 App 项目，设置 `app.enabled: true`，并给 iOS / Android / 桌面 App target 配置测试命令。
4. 运行：

```bash
npm run quality:doctor
npm run quality:system
```

## Web / 浏览器测试

模板默认包含：

- `tests/web/smoke.spec.ts`：打开入口页并验证页面可见。
- `tests/web/quality.spec.ts`：无障碍、console error、失败请求、横向溢出、基础性能预算。
- `tests/web/concurrency.spec.ts`：多个独立浏览器上下文并发打开产品入口。

## App 测试

App 测试采用适配器协议，不强绑定某个生态。你可以使用：

- Maestro
- Detox
- Appium
- xcodebuild
- Playwright Electron
- 任意 custom command

只要在 `quality-test.config.json` 中配置：

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

`test-programme app` 会执行这些命令并生成 `artifacts/app-summary.md`。

## 压测

`test-programme load` 默认运行 smoke profile，检查成功率、错误率、RPS、P95、P99。

真实环境压测：

```bash
LOAD_TEST_BASE_URL=https://your-domain.com test-programme load
```

更高压力：

```bash
LOAD_TEST_CONCURRENCY=50 LOAD_TEST_DURATION=60 test-programme load
```

不要对不属于你的第三方服务运行压测。

## 产物

- `artifacts/quality-system-summary.md`
- `artifacts/quality-summary.md`
- `artifacts/app-summary.md`
- `artifacts/load-summary.md`
- `artifacts/results.json`
- `artifacts/junit.xml`
- `artifacts/playwright-report/index.html`

## 维护原则

- Web 功能流程写 Playwright 测试。
- Native App 测试用 app adapter command 接入。
- HTTP 压测只压自己拥有或获准测试的服务。
- CI 默认跑 `test-programme system`。
- 对真实外部环境测试使用显式环境变量，不要混进默认 mock-first 门禁。
