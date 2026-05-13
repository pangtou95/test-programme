# App 测试适配说明

App 测试不强绑定某一个生态。你可以在 `quality-test.config.json` 里启用 `app.enabled`，然后为 iOS、Android、桌面 App 配置任意测试命令。

支持的典型驱动：

- Maestro
- Detox
- Appium
- xcodebuild / XcodeBuildMCP
- Playwright Electron
- 任意 custom shell command

`npm run quality:app` 或 `quality-test app` 会按 target 执行 `doctorCommand`、`installCommand`、`startCommand`、`testCommand`，并生成 app 测试摘要。
