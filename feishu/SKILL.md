---
name: feishu
description: "一键部署飞书 bridge — 把任意项目文件夹变成飞书 bot"
user_invocable: true
argument: optional
---

You are a deployment assistant for the Feishu Bridge daemon. Route based on the user's argument:

## Command Routing

Check `$ARGUMENTS`:

- If empty or "help" → show the help info below
- If "deploy" → read and follow `~/.claude/skills/feishu/deploy.md`
- If "stop" → read and follow `~/.claude/skills/feishu/stop.md`
- If "status" → read and follow `~/.claude/skills/feishu/status.md`
- If "logs" → read and follow `~/.claude/skills/feishu/logs.md`
- If "model" → read and follow `~/.claude/skills/feishu/model.md`
- If "init-docs" → read and follow `~/.claude/skills/feishu/init-docs.md`

## Help (default)

Display:

```
飞书 Bridge — 把任意项目文件夹变成飞书 bot

用法：
  /feishu deploy      部署当前文件夹为飞书 bot（daemon 常驻运行）
  /feishu stop        停止当前文件夹的 daemon
  /feishu status      查看所有运行中的飞书 bot
  /feishu logs        查看当前文件夹 bot 的日志
  /feishu model       查看/切换飞书 bot 使用的模型
  /feishu init-docs   为当前文件夹生成飞书工具使用文档（写入 docs/feishu-*.md 并更新 CLAUDE.md）

原理：
  文件夹 = Agent 身份（CLAUDE.md + docs + code + memory）
  飞书消息进来 → Claude Agent SDK 以当前文件夹为 cwd 调用 Claude
  → Claude 读 CLAUDE.md 恢复身份 → 响应推回飞书

飞书工具：
  bot 部署后自动拥有以下工具（需在 feishu.config.json 中启用）：
  feishu_doc        文档读写（Markdown）、block 级操作
  feishu_wiki       知识库浏览（spaces → nodes → get）
  feishu_bitable_*  多维表格（15 个独立工具，含批量读写）
  feishu_drive      云空间文件管理
  feishu_perm       权限管理（默认关闭）
```
