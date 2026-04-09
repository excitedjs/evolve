# cli

终端入口包，负责用户输入、会话历史和流式输出渲染。

## Owns

- `src/app.tsx`：TUI 稳定入口；对外保留 `App` 导出
- `src/config.ts`：CLI 配置文件发现与 `~/.evolve/config.json` 加载
- `src/options.ts`：CLI 启动参数解析；当前承载 `--config/-c` 与 `--workspace/-w`
- `src/tui/index.tsx`：Ink TUI 根组件；负责状态编排、输入绑定和布局装配
- `src/tui/components/*`：头部、消息项、composer、命令菜单等纯展示组件
- `src/tui/state.ts`：TUI 内部消息状态变换
- `src/index.ts`：CLI 启动入口

## High-Leverage Facts

- `cli` 负责终端 I/O，不负责模型配置和业务 graph 定义
- 启动调用链先经过 `src/index.ts`：解析 `--config/-c`、`--workspace/-w`，切换工作目录，再加载 CLI 配置并把默认模型/effort 注入 TUI
- 默认配置路径是 `~/.evolve/config.json`；显式 `--config` 不存在时应直接报错，默认路径不存在时才回退到 env
- 当前对话调用链从 `src/tui/index.tsx` 的 `submit()` 进入 `@evolve/core.ConversationSession.submit()`，再通过 `createConversationRunner()` 进入 `packages/core/src/graph.ts`
- `/model` 和 `/effort` 是 TUI 内部运行时切换命令；命令菜单只负责切换当前会话配置，不负责写回配置文件
- 如果未来增加 TUI / Web 适配层，适配层应只处理各自的输入输出和展示，不要重复实现 core 里的共享运行时能力

## See Also

- [agent-sdk](/.agents/domains/agent-sdk.md)
- [core](/.agents/packages/core.md)
