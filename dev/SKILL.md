---
name: dev
description: "Harness Engineering — 结构化开发流程（Builder / Reviewer / QA）"
user_invocable: true
argument: optional
---

# /dev — Harness Engineering v3

## 核心原则

1. **仓库是唯一可信知识源**，聊天记录不是持久记忆。每次会话从 AGENTS.md 开始。
2. **先读后写**：改代码前先读 AGENTS.md → 相关文档 → 相关代码。
3. **文档同步**：改代码后必须检查是否需要同步文档。
4. **人类反馈必须持久化**到仓库，不能只停留在聊天里。
5. **用简单语言沟通**，用户是技术小白。避免术语，多用类比。

## 路由

根据参数分发到对应模块：

| 参数 | 模块 | 说明 |
|------|------|------|
| `init` | init.md | 初始化项目 harness 结构 |
| `review` | review.md | Reviewer 审查最近改动 |
| `qa` | qa.md | QA 验证功能 |
| `check` | check.md | 健康检查 + Doc Sync + Tech Debt |
| `feedback` | feedback.md | 记录人类测试反馈 |
| `log` | log.md | 保存当前会话日志 |
| 其他任何文字 | build.md | Builder 模式：研究→规划→执行→验证 |
| 无参数 | — | 显示帮助信息 |

## 路由逻辑

读取 `$ARGUMENTS`：

- 如果为空 → 显示下方帮助信息
- 如果是 `init` → 加载 `~/.claude/skills/dev/init.md` 并执行
- 如果是 `review` → 加载 `~/.claude/skills/dev/review.md` 并执行
- 如果是 `qa` → 加载 `~/.claude/skills/dev/qa.md` 并执行
- 如果是 `check` → 加载 `~/.claude/skills/dev/check.md` 并执行
- 如果是 `feedback` → 加载 `~/.claude/skills/dev/feedback.md` 并执行
- 如果是 `log` → 加载 `~/.claude/skills/dev/log.md` 并执行
- 否则 → 将参数视为任务描述，加载 `~/.claude/skills/dev/build.md` 并以参数作为任务执行

## 帮助信息（无参数时显示）

```
/dev — Harness Engineering v3

可用命令：
  /dev init              初始化项目开发框架
  /dev <任务描述>         开发模式（研究→规划→执行→验证）
  /dev review            审查最近的代码改动
  /dev qa                验证功能是否正常
  /dev check             健康检查 + 文档同步 + Tech Debt
  /dev feedback          记录测试反馈
  /dev log               保存当前会话日志

示例：
  /dev 添加用户登录功能
  /dev 修复搜索结果排序问题
  /dev review
```

## Agent 角色

### Builder（默认）
接收任务描述，按 RPEV 流程执行：Research → Plan → Execute → Verify。
最小化改动，遵守架构约束，完成后检查文档同步。

### Reviewer
审查最近的代码改动，对照需求文档和架构文档检查。
输出：Critical / Improvements / Acceptable。

### QA
验证功能是否满足 acceptance criteria，检查边界条件和回归问题。
输出：Passed / Failed / Missing Tests。
