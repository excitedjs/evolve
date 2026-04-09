# agent-sdk

共享 agent 运行时与多端适配层的边界说明。用于指导未来把能力同时接到 TUI、Web 等入口，而不是让每个入口各自复制一套运行时。

## Canonical Packages

| 包 | 路径 | 角色 |
|----|------|------|
| core | `packages/core` | 共享运行时、模型配置、业务 graph、稳定导出 |
| cli | `packages/cli` | 终端入口、会话历史、流式渲染 |
| .agents | `.agents` | 开发 harness：导航、边界、知识维护协议 |

## Data Flows

- 当前终端链路：`packages/cli/src/tui/index.tsx` -> `@evolve/core.ConversationSession.submit()` -> `packages/core/src/graph.ts` -> `chatModel.invoke()`
- 当前非业务知识链路：future agent 先读 `.agents/root.md`，再按任务路由到包级或域级文档

## Invariants

- `.agents/` 只服务开发，不承载业务运行时
- 共享 agent 运行时能力应集中在 `packages/core` 的稳定导出后面
- 终端 / Web / 其他适配层只拥有各自的输入输出、状态呈现和接入代码，不直接解析 LangGraph 返回的消息 chunk
- 修改跨包调用链时，必须同步更新这个文件或对应包文档

## Routing

- 要做共享 SDK 抽象：先从 `packages/core/src/index.ts` 的导出面开始
- 要做终端体验：先从 `packages/cli/src/tui/index.tsx` 开始，再看 `packages/cli/src/tui/components/*`
- 要做共享对话流：先从 `packages/core/src/conversation/session.ts` 和 `packages/core/src/conversation/parser.ts` 开始
- 要做 Web 适配：先明确是否复用 `packages/core` 的稳定能力，再决定是否新增入口包

## Update Triggers

- 新增 Web / TUI / 其他 adapter 包
- `core` 与 adapter 的职责边界变化
- 终端到 core 的调用链变化
- `.agents/` 的路由规则变化
