# /dev qa — QA 模式

## 执行流程

### 1. 读取上下文

1. **读 AGENTS.md** — 理解项目规则
2. **读 docs/product.md** — 获取 Acceptance Criteria
3. **读 docs/feedback/known-issues.md** — 了解已知问题
4. **读 docs/feedback/human-test-log.md** — 了解之前的测试反馈

### 2. 确定验证范围

- 检查 `git diff` 和 `git log` 查看最近改动
- 检查 `docs/plans/active/` 中的活跃计划
- 向用户确认："我看到最近改了 XX 功能，要验证这个吗？"

### 3. 验证清单

#### Acceptance Criteria
- 逐条检查 `docs/product.md` 或 Feature Plan 中的 AC
- 每条标记：Pass / Fail / Cannot Verify

#### 边界条件
- 空值/空列表
- 极大/极小值
- 特殊字符
- 并发/竞态（如果适用）
- 权限边界（如果适用）

#### 回归检查
- 对照 `docs/feedback/known-issues.md`，确认已修复的问题没有复现
- 运行完整测试套件
- 检查相关模块是否受影响

#### 测试完整性
- 是否有足够的单元测试
- 是否有集成测试（如果适用）
- 测试是否覆盖了边界条件

### 4. 输出验证结果

```markdown
## QA 结果

### Passed
- [AC1] 描述 — 验证方式
- [AC2] 描述 — 验证方式

### Failed
- [AC3] 描述 — 期望 vs 实际

### Missing Tests
- 描述缺少的测试覆盖

### 回归检查
- 所有已知问题未复现 / 发现复现的问题

### 总结
Pass / Fail — 一句话说明
```

### 5. 跟进

- 如果有 Failed 项 → 问用户是否创建 issue（`docs/issues/open/`）
- 如果需要修复 → 建议用户运行 `/dev <修复描述>`
- 如果全部通过 → 建议用户进行手动测试，然后用 `/dev feedback` 记录结果
