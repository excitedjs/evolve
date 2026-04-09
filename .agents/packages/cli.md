# cli

终端入口包，负责用户输入、会话历史和流式输出渲染。

## Owns

- `src/app.tsx`：TUI 稳定入口；对外保留 `App` 导出
- `src/tui/index.tsx`：Ink TUI 根组件；负责状态编排、输入绑定和布局装配
- `src/tui/components/*`：头部、消息项、composer 等纯展示组件
- `src/tui/state.ts`：TUI 内部消息状态变换
- `src/index.ts`：CLI 启动入口

## High-Leverage Facts

- `cli` 负责终端 I/O，不负责模型配置和业务 graph 定义
- 当前调用链从 `src/tui/index.tsx` 的 `submit()` 进入 `@evolve/core.ConversationSession.submit()`，再进入 `packages/core/src/graph.ts`
- 如果未来增加 TUI / Web 适配层，适配层应只处理各自的输入输出和展示，不要重复实现 core 里的共享运行时能力

## See Also

- [agent-sdk](/.agents/domains/agent-sdk.md)
- [core](/.agents/packages/core.md)
