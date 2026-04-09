# test-langgraph

## Rules

- `.agents/` 只承载开发 harness，不承载业务运行时逻辑；业务实现放在 `packages/`。
- 任务涉及测试策略或新增测试时，读 [testing](/.agents/rules/testing.md)。
- 任务涉及 `packages/core` 时，先读 [core](/.agents/packages/core.md)。
- 任务涉及 `packages/cli` 时，先读 [cli](/.agents/packages/cli.md)。
- 任务跨越共享运行时边界和终端 / Web 适配层时，先读 [agent-sdk](/.agents/domains/agent-sdk.md)。
- 修改 `.agents/`，或改动了包边界、调用链、所有权、扩展入口时，读 [CONTRIBUTING](/.agents/CONTRIBUTING.md) 并做 knowledge delta 决策。
