# 测试策略

## 目标

本测试工程用于把产品质量拆成可持续运行的门禁：

- Web/浏览器 E2E。
- App 自定义适配器测试。
- 多浏览器会话并发。
- HTTP smoke / stress 压测。
- CI 报告与可追踪产物。

## 测试金字塔位置

这套工程不替代单元测试和接口测试，而是负责更接近用户真实行为的质量层：

- 用户是否能打开产品。
- 页面是否出现严重运行期错误。
- 多用户并发是否有明显状态污染。
- App 端 smoke 流程是否可执行。
- HTTP 层是否满足基础成功率和延迟预算。

## 默认门禁

`quality-test system` 会串联：

1. Web/browser E2E gate。
2. App adapter gate。
3. HTTP smoke load gate。

任何一步失败，整体失败。
