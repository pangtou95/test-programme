# Test Programme

`test-programme` is a product-grade quality engineering toolkit for Web, browser, desktop app, mobile app, E2E, concurrency, HTTP load testing, CI gates, and release-ready test reporting.

It is designed as an npm-distributed quality system, not as a one-off Playwright folder.

## Package Name

Recommended npm package name:

```text
test-programme
```

Registry check performed on 2026-05-13:

```text
npm view test-programme name version --json
E404 Not Found
```

That means the package name was not registered at the time of verification. npm can still require your own account OTP / 2FA code during publishing; that code must come from your npm account, not from this project.

## Installation

After publishing to npm:

```bash
npm install -D test-programme
npx test-programme init
npm run quality:doctor
npm run quality:system
```

The CLI also exposes a compatibility alias:

```bash
npx quality-test init
```

## Supported Targets

- **Web / Browser**: websites, dashboards, SaaS apps, admin panels, H5 pages, and browser-based products.
- **Desktop App**: Electron, Tauri, native desktop apps, or any custom desktop test command.
- **iOS App**: Maestro, Detox, Appium, xcodebuild, XcodeBuildMCP, or a custom command.
- **Android App**: Maestro, Detox, Appium, or a custom command.
- **HTTP Services**: smoke and stress load profiles with success-rate, error-rate, RPS, P95, and P99 thresholds.
- **CI/CD**: GitHub Actions templates for quality gates and npm release workflows.

## Quick Start

```bash
npx test-programme init
npm run quality:doctor
npm run quality:system
```

`init` creates:

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

## CLI

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

## Web Quality Gate

The generated Web suite includes:

- smoke test for the product entrypoint
- accessibility checks through Axe
- console error detection
- failed request detection
- horizontal overflow checks
- browser performance budgets
- multi-session browser concurrency

## App Quality Gate

App testing is implemented through an adapter protocol instead of pretending one runner can own every platform.

Example:

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

This keeps Web and App under one quality gate while letting each App ecosystem keep its best native test runner.

## Load Testing

Default profiles:

- `smoke`: CI-safe baseline load test
- `stress`: higher-pressure profile for local or staging environments

```bash
test-programme load
test-programme load --profile stress
```

For a real target:

```bash
LOAD_TEST_BASE_URL=https://your-domain.com test-programme load
```

Only run load tests against systems you own or are authorized to test.

## GitHub Actions

The template includes:

```text
quality_test/ci/github-actions-quality-test.yml
```

Copy it to:

```text
.github/workflows/quality-test.yml
```

Recommended CI steps:

```bash
npm run quality:doctor
npm run quality:system
npm run quality:summary
```

## npm Release

Local verification:

```bash
npm run pack:check
```

Manual publish:

```bash
npm publish --access public --provenance
```

If npm asks for an OTP, use the verification code from your npm account authenticator or email. The project cannot generate that code for you.

## License

MIT
