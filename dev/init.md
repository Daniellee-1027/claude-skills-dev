# /dev init — 项目初始化

## 执行流程

### 1. 检查前置条件

- 确认当前目录是一个 git 仓库（如果不是，先 `git init`）
- 检查是否已有 AGENTS.md（如果有，询问用户是否要重新初始化）

### 2. 收集项目信息

向用户询问以下信息（用简单语言）：

1. **项目叫什么名字？**
2. **用一两句话描述这个项目是做什么的？**
3. **用了什么技术？**（比如：Python + Flask，React + Node.js，等等）
4. **现在项目是什么状态？**（刚开始 / 已经有一些代码 / 比较成熟）

### 3. 扫描现有项目

如果项目已有代码：
- 扫描目录结构，了解项目布局
- 读取现有的 README.md、package.json、requirements.txt 等
- 识别技术栈和项目结构

### 4. 创建目录结构

```bash
# 创建文档目录
mkdir -p docs/plans/active
mkdir -p docs/plans/completed
mkdir -p docs/feedback
mkdir -p docs/logs
mkdir -p docs/issues/open
mkdir -p docs/issues/closed
```

注意：不要创建 `src/`、`tests/`、`scripts/` — 这些由用户根据项目需要自行创建。

### 5. 生成核心文件

按以下顺序生成文件（每个文件用用户提供的信息填充）：

#### AGENTS.md（最重要）

```markdown
# Project: {项目名}

## 核心规则
1. 仓库是唯一知识源，聊天记录不是记忆
2. 改代码前先读相关文档
3. 改代码后检查文档是否需要同步

## 文档地图（先找到这些文件再开始工作）
- 产品需求 → docs/product.md
- 架构设计 → ARCHITECTURE.md
- 技术规范 → docs/engineering.md
- 路线图 → docs/roadmap.md
- 人类反馈 → docs/feedback/human-test-log.md
- 已知问题 → docs/feedback/known-issues.md
- 待处理 Issue → docs/issues/open/
- Feature 计划 → docs/plans/active/
- 对话日志 → docs/logs/

## 开发流程
1. 读 AGENTS.md → 读相关文档 → 探索代码
2. 创建 feature plan → docs/plans/active/<feature>.md
3. Builder 实现 → 最小方案 → 实现 → 测试
4. Reviewer 审查 → 需求/架构/重复/命名/测试
5. QA 验证 → acceptance criteria / 边界 / 回归
6. 更新文档

## 文档同步规则
- 行为变化 → 更新 docs/product.md
- 架构变化 → 更新 ARCHITECTURE.md + docs/engineering.md
- 临时方案 → 记录到 docs/roadmap.md (Tech Debt) + docs/feedback/known-issues.md

## Human Feedback 处理
1. 反馈记录在 docs/feedback/human-test-log.md
2. 可执行问题 → 创建 docs/issues/open/<issue>.md
3. 修复后 → 移动到 docs/issues/closed/
4. 产品决策 → 记录到 docs/feedback/decisions.md
```

#### CLAUDE.md

```markdown
# {项目名}

开发前请先阅读 AGENTS.md，那是你的操作指南。

## 快速参考
- 技术栈：{技术栈}
- 产品文档：docs/product.md
- 架构文档：ARCHITECTURE.md
- 技术规范：docs/engineering.md
```

#### ARCHITECTURE.md

根据扫描到的项目结构生成，包含：
- 项目概览（一段话）
- 模块关系（目录结构 + 每个模块的职责）
- 依赖规则（哪些模块可以依赖哪些）
- 数据流（如果能识别的话）

#### docs/product.md

```markdown
# {项目名} — 产品文档

## 产品概览
{项目描述}

## 用户流程
<!-- 描述主要用户操作流程 -->

## 需求表
| ID | 需求 | 状态 | Acceptance Criteria |
|----|------|------|---------------------|
| R1 | — | planned | — |

## 变更记录
| 日期 | 变更 | 原因 |
|------|------|------|
```

#### docs/engineering.md

```markdown
# {项目名} — 技术规范

## 技术栈
{技术栈详情}

## 编码规则
<!-- 项目特定的编码约定 -->

## 命名规范
<!-- 文件、变量、函数的命名规则 -->

## 开发环境
<!-- 如何搭建开发环境 -->
```

#### docs/roadmap.md

```markdown
# {项目名} — 路线图

## 当前阶段
{项目状态}

## 计划
| 优先级 | 功能 | 状态 |
|--------|------|------|
| P0 | — | — |

## Tech Debt
| 位置 | 描述 | 优先级 |
|------|------|--------|
```

#### docs/feedback/human-test-log.md

```markdown
# 人类测试反馈记录

<!-- 格式：
## YYYY-MM-DD
### 测试内容
描述

### 发现的问题
- 问题1 → issue: docs/issues/open/xxx.md
- 问题2（已解决）

### 整体感受
描述
-->
```

#### docs/feedback/decisions.md

```markdown
# 产品决策记录

<!-- 格式：
## YYYY-MM-DD: 决策标题
**背景**：为什么需要做决定
**决定**：最终选了什么
**原因**：为什么这么选
**影响**：这个决定影响了哪些地方
-->
```

#### docs/feedback/known-issues.md

```markdown
# 已知问题

| 发现日期 | 描述 | 严重程度 | 状态 | 关联 Issue |
|----------|------|----------|------|------------|
```

#### docs/plans/_template.md

```markdown
# Feature: {功能名}

## 背景
为什么要做这个功能？

## 目标
- 目标1
- 目标2

## 方案
### 概述
一段话描述方案

### 改动范围
| 文件 | 改动 |
|------|------|
| — | — |

### 不做什么
- 明确排除的范围

## Acceptance Criteria
- [ ] AC1
- [ ] AC2

## 状态
- [ ] 方案确认
- [ ] 实现完成
- [ ] Review 通过
- [ ] QA 通过
- [ ] 文档同步
```

### 6. 生成 README.md（如果不存在）

简洁的项目 README，包含项目名、描述、快速开始步骤。

### 7. 完成

向用户展示生成的文件列表，并说明：

```
项目初始化完成！生成了以下文件：

  AGENTS.md          — Agent 操作指南（最重要的文件）
  CLAUDE.md          — Claude Code 入口
  ARCHITECTURE.md    — 架构概览
  docs/product.md    — 产品需求
  docs/engineering.md — 技术规范
  docs/roadmap.md    — 路线图 + Tech Debt

下一步：
  /dev <任务描述>     开始开发
  /dev check          检查项目健康状态
```
