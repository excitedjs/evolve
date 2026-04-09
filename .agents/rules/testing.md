# testing

## Test Infrastructure

- 测试文件放在对应包的 `__tests__/` 目录下，命名为 `*.test.ts`
- 使用 Node.js 内置 `node:test` 模块和 `assert`
- 使用 `tsx` 运行 TypeScript 测试
- 在对应包目录执行 `pnpm test`

## Writing Rules

- 测真实行为，不测 “函数存在”
- 每个 case 只验证一个明确场景
- 对外部模型调用只断言结构、非空结果和关键字段，不断言精确文案
- import 时有副作用的模块，用子进程隔离测试
- 能复用的辅助函数要提取

## Done Bar

- 所有 case 必须完整通过
- 不允许留下 skip 的 case
