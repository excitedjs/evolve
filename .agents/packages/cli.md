# cli

终端入口包，负责用户输入、会话历史和流式输出渲染。

## Owns

- `src/cli.ts`：readline 交互、会话历史、调用 `graph.stream()`
- `src/stream-handler.ts`：流式 chunk 渲染与 reasoning / content 分流
- `src/index.ts`：CLI 启动入口

## High-Leverage Facts

- `cli` 负责终端 I/O，不负责模型配置和业务 graph 定义
- 当前调用链从 `CLI.processUserInput()` 进入 `@evolve/core.graph.stream()`，再进入 `packages/core/src/graph.ts`
- 如果未来增加 TUI / Web 适配层，适配层应只处理各自的输入输出和展示，不要重复实现 core 里的共享运行时能力

## See Also

- [agent-sdk](/.agents/domains/agent-sdk.md)
- [core](/.agents/packages/core.md)
