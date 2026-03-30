# /dev <任务> — Builder 模式

任务描述：`$ARGUMENTS`

## 执行流程：RPEV（Research → Plan → Execute → Verify）

### Phase 1: Research（研究）

1. **读 AGENTS.md**（必须第一步）
   - 理解项目规则和文档地图
   - 如果 AGENTS.md 不存在 → 提示用户先运行 `/dev init`

2. **读相关文档**（根据任务类型选择）
   - 产品需求 → `docs/product.md`
   - 架构约束 → `ARCHITECTURE.md`
   - 技术规范 → `docs/engineering.md`
   - 已知问题 → `docs/feedback/known-issues.md`
   - 人类反馈 → `docs/feedback/human-test-log.md`
   - 现有计划 → `docs/plans/active/`

3. **探索相关代码**
   - 找到与任务相关的文件
   - 理解现有实现和依赖关系
   - 检查是否有相关的 open issues（`docs/issues/open/`）

4. **汇总发现**（内部，不需要输出给用户）

### Phase 2: Plan（规划）

1. **提出最小实现方案**
   - 用简单语言描述要做什么
   - 列出要改哪些文件
   - 说明为什么这么做
   - 明确不做什么

2. **创建 Feature Plan**（对于非 trivial 的任务）
   - 创建 `docs/plans/active/<feature>.md`（参考 `docs/plans/_template.md`）
   - 对于小修复/调整可以跳过

3. **等待用户确认**
   - 用简单的语言向用户解释方案
   - 问用户："这样可以吗？要调整什么？"
   - **必须等用户确认后才能进入 Execute 阶段**

### Phase 3: Execute（执行）

1. **实现改动**
   - 遵守 `docs/engineering.md` 中的编码规则
   - 遵守 `ARCHITECTURE.md` 中的架构约束
   - 最小化改动范围，不做额外"改进"
   - 每个改动都要有清晰的目的

2. **编写/更新测试**（如果项目有测试框架）
   - 为新功能编写测试
   - 确保现有测试不被破坏

3. **运行测试**
   - 运行相关测试，确保通过
   - 如果有 lint/格式化工具，也运行一遍

### Phase 4: Verify（验证）

1. **运行完整测试**
   - 确保没有回归问题

2. **检查文档同步**（必须）
   - 行为变化了？→ 更新 `docs/product.md`
   - 架构变化了？→ 更新 `ARCHITECTURE.md` + `docs/engineering.md`
   - 用了临时方案？→ 记录到 `docs/roadmap.md`（Tech Debt）+ `docs/feedback/known-issues.md`
   - Feature Plan 完成了？→ 更新 plan 状态，考虑移到 `docs/plans/completed/`

3. **总结**
   - 用简单语言告诉用户做了什么
   - 列出改了哪些文件
   - 提醒用户可以测试的点
   - 如果有遗留问题，明确说明

4. **询问是否保存 Session Log**
   - 问用户："要保存这次的开发记录吗？"
   - 如果是 → 执行 `log.md` 流程

## 注意事项

- **不要跳过 Plan 阶段**。即使任务看起来很简单，也要先告诉用户你打算怎么做。
- **不要做超出任务范围的事情**。看到"顺便可以改进"的地方，忍住。
- **遇到不确定的决策**，问用户。不要自己猜。
- **如果发现 bug 或 tech debt**，记录到 `docs/feedback/known-issues.md` 或 `docs/roadmap.md`，不要在当前任务中修复（除非用户同意）。
