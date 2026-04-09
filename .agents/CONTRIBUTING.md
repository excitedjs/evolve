# .agents Harness Guide

`.agents/` 是这个仓库的开发 harness source of truth，用来记录未来 agent 不容易仅靠读代码就快速得出的导航、边界和陷阱。

## Harness Objective

- **High-leverage**：能减少未来 agent 一轮以上错误探索
- **Routed**：让 agent 知道该从哪个包、哪个文件开始
- **Checkable**：结构稳定，后续可以脚本化检查
- **Fresh**：代码边界变化时同步更新

## Knowledge Delta Protocol

每次非平凡改动结束前，都要做一次 knowledge delta review：

1. 这次工作是否改变了包边界、调用链、扩展入口、隐藏约束，或让你确认了一个未来很容易走错的事实？
2. 如果是，必须在同一次改动里更新 `.agents/`。
3. 如果不是，不要为了“看起来完整”而扩写 `.agents/`。

## Typical YES

- 新增共享运行时与适配层之间的边界
- 新增或重排跨包调用链
- 新增未来 agent 容易放错位置的扩展点
- 发现某个功能应该从哪个包开始读，且这一点单靠名字不明显

## Typical NO

- 只改了局部实现，包边界和入口未变
- 从单个文件就能直接看懂的事实
- 临时调试结论、TODO、一次性进度

## Routing

- `root.md`：仓库级规则和读文档入口
- `domains/*.md`：跨包调用链、边界、扩展路由
- `packages/*.md`：包级职责、入口、局部陷阱

## Writing Standard

- 只写能改善路由质量和决策质量的事实
- 优先短 bullet，不写教程
- 文档里的路径和符号写入前必须先在代码里验证

## Maintenance

- 修改 `.agents/` 后，运行 `node .agents/scripts/link.js` 刷新外部投影文件
- 运行 `node .agents/scripts/check.js` 做结构自检，确保链接、包映射和内部引用未漂移
- 运行 `pnpm agents:test` 验证 `.agents/scripts/*` 的真实行为；不要把这类测试挂到业务包里
- 所有能由 `link.js` 生成的文件和目录都属于本地投影产物，不提交到 git；只需确认本地可生成且 `check.js` 通过
