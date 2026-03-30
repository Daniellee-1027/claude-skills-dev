# /dev check — 健康检查 + Doc Sync + Tech Debt

## 执行流程

### 1. 项目完整性检查

检查以下文件/目录是否存在：

| 文件 | 必须 | 说明 |
|------|------|------|
| AGENTS.md | 是 | Agent 操作指南 |
| CLAUDE.md | 是 | Claude Code 入口 |
| ARCHITECTURE.md | 是 | 架构概览 |
| docs/product.md | 是 | 产品需求 |
| docs/engineering.md | 是 | 技术规范 |
| docs/roadmap.md | 是 | 路线图 |
| docs/feedback/human-test-log.md | 是 | 测试反馈 |
| docs/feedback/known-issues.md | 是 | 已知问题 |
| docs/feedback/decisions.md | 是 | 决策记录 |
| docs/plans/_template.md | 建议 | Plan 模板 |
| docs/plans/active/ | 建议 | 活跃计划目录 |
| docs/issues/open/ | 建议 | Open Issues |
| docs/logs/ | 建议 | 对话日志 |

如果核心文件缺失 → 建议运行 `/dev init`

### 2. Doc Sync 检查

#### ARCHITECTURE.md vs 实际代码
- 读取 ARCHITECTURE.md 中提到的模块/目录
- 检查这些模块/目录是否实际存在
- 检查是否有新的重要模块未被记录

#### docs/product.md vs 实际功能
- 读取需求表中的需求
- 粗略检查是否有对应实现
- 标记状态可能需要更新的需求

#### docs/engineering.md vs 实际代码
- 检查编码规则是否被遵守（抽样检查）
- 检查命名规范是否一致

### 3. Tech Debt 扫描

#### 代码扫描
- 搜索 `TODO`、`FIXME`、`HACK`、`XXX`、`WORKAROUND` 注释
- 收集位置和内容

#### 对照 roadmap
- 读取 `docs/roadmap.md` 中的 Tech Debt 记录
- 对比代码中发现的 vs 已记录的
- 找出：
  - 代码中有但 roadmap 未记录的（→ 建议补充）
  - roadmap 中有但代码已修复的（→ 建议移除）

### 4. Issue 和反馈检查

- 检查 `docs/issues/open/` 中是否有长期未处理的 issue
- 检查 `docs/feedback/human-test-log.md` 中是否有未转化为 issue 的反馈
- 检查最近的 git 改动是否有对应的 session log（`docs/logs/`）

### 5. 输出健康报告

```markdown
## 项目健康报告

### 项目完整性
- [x] AGENTS.md
- [x] ARCHITECTURE.md
- [ ] docs/engineering.md — 缺失！

### Doc Sync
- ARCHITECTURE.md: 发现 2 个未记录的新模块
- product.md: 3 个需求状态可能需要更新

### Tech Debt
- 代码中发现 5 个 TODO，其中 2 个未记录在 roadmap
- roadmap 中有 1 个已修复的 tech debt 可以移除

### Issue & 反馈
- 3 个 open issue（最早: 2026-02-15）
- human-test-log 中有 1 条未转化为 issue 的反馈
- 最近 3 天的改动没有 session log

### 建议行动
1. 【重要】补充 docs/engineering.md
2. 更新 ARCHITECTURE.md，添加 auth/ 和 api/ 模块描述
3. 将 TODO 记录补充到 roadmap
4. 检查 2 周前的 open issue 是否还有效
```
