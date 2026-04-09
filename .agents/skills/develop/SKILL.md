---
name: develop
description: Use when the user wants to add a requirement, change a requirement, refine acceptance criteria, split implementation scope, or clarify delivery boundaries. Trigger proactively on requests like “加需求”, “补一个需求”, “做个新需求”, “改下需求”, “需求拆一下”, “补验收标准”, or any request that is really about shaping product or engineering requirements before or alongside implementation.
---

# Requirement Development

为“需求开发”提供统一范式，避免直接跳进实现，先把目标、边界、验收和落点说清楚。一旦需求明确，默认转入无人工介入的端到端交付模式。

## Use This Skill When

- 用户明确说要“加需求 / 改需求 / 补需求 / 拆需求”
- 用户在讨论功能，但真正缺的是目标、范围、验收口径或实现边界
- 用户要开始做一个新能力，但仓库里还没有稳定的需求约束

## Core Rules

- 先验证代码里的现状，再定义需求；不要只根据聊天上下文脑补现状
- 澄清阶段允许追问用户，但只追问会影响实现边界、验收或方案选择的问题
- 澄清阶段必须联网搜索业界方案和开源最佳实践，再结合当前仓库代码收敛需求
- 需求必须落到仓库内的真实边界：入口包、共享层、适配层、数据流
- 先定义“不做什么”，再定义“做什么”，防止需求膨胀
- 验收标准必须可验证，优先写成代码行为、测试行为或可观察结果
- 如果需求本质上是实现请求，也先补齐最小需求骨架，再进入代码改动
- 一旦需求明确，默认不再等待人工介入：拉分支、实现、补测试、验证、提交，除非遇到真实阻塞或高风险歧义

## Workflow

1. 读代码确认当前行为、现有边界和可复用入口
2. 联网搜索业界方案、竞品模式或开源最佳实践，提炼可复用约束
3. 用一句话重述需求目标，避免目标漂移
4. 明确范围：
   当前要做什么
   当前明确不做什么
5. 明确影响面：
   涉及哪些包、入口、适配层、配置或测试
6. 明确验收：
   用户可观察到什么变化
   代码或测试应证明什么
7. 需求冻结后直接进入执行：
   创建分支
   实现代码
   补测试 case
   完成验证
   提交代码
8. 如果需求跨包或会改变 future agent 的起点、边界、调用链：同步更新 `.agents`

## Output Contract

- 如果边界不清：先给出一个最小需求骨架，并只追问真正阻塞执行的问题
- 如果信息已经足够：直接给出收敛后的需求定义，随后进入无人工介入执行
- 执行阶段默认完成到可提交状态，而不是停在方案、草稿或半成品

## Requirement Skeleton

默认按下面 5 个槽位组织：

- Goal：这次真正要解决什么问题
- Scope：这次包含什么，不包含什么
- Surface：会影响哪些入口、包和用户路径
- Acceptance：怎么判断完成
- Constraints：已有架构、兼容性、性能、测试或交付约束

## References

- 详细检查清单见 [references/checklist.md](./references/checklist.md)
- 澄清阶段的外部调研清单见 [references/research.md](./references/research.md)
