# core

共享运行时与业务编排包，当前承载模型配置、graph 入口和对外稳定导出。

## Owns

- `src/graph.ts`：当前业务 graph 入口；这是产品运行时，不是 harness 落点
- `src/conversation.ts`：共享会话运行时的稳定导出面
- `src/conversation/session.ts`：会话历史与提交流程
- `src/conversation/parser.ts`：LangGraph chunk 归一化与文本提取
- `src/conversation/runner.ts`：默认 graph runner 适配
- `src/config.ts`：模型与环境变量配置
- `src/index.ts`：对外稳定导出面
- `src/logger.ts`：基础日志接口

## High-Leverage Facts

- 其他包应通过 `@evolve/core` 的包级导出消费能力，不要直接深层引用 `src/*`
- 终端 / Web 等适配层如果要接对话流，优先从 `ConversationSession.submit()` 开始，而不是各自直接解析 `graph.stream()`
- 如果开始抽象共享 `agentsdk` 能力，优先放到这个包并从 `src/index.ts` 统一暴露
- 任何 “为了让 agent 更好开发” 的规则、导航、知识沉淀都不应写进这个包，而应写进 `.agents/`

## See Also

- [agent-sdk](/.agents/domains/agent-sdk.md)
- [cli](/.agents/packages/cli.md)
