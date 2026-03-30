# Initialize Bot Context

为当前项目的飞书 bot 初始化上下文、记忆和日志系统。交互式引导用户填写配置。

## Step 1: 创建文件结构

1. 读取 `~/.claude/skills/feishu/docs/bot-context-template.md` 作为模板
2. 如果 `{cwd}/docs/bot-context.md` 不存在，复制模板过去
3. 如果 `{cwd}/memory/learnings.md` 不存在，创建（内容：`# Bot 经验记录\n\n`）
4. 创建 `{cwd}/logs/` 目录（如不存在）

## Step 2: 交互式填写上下文

逐项询问用户，收集以下信息：

1. **称呼**：「你希望 bot 怎么称呼你？」
2. **知识库名称**：「你的飞书知识库叫什么名字？」（例：hongbo's workspace）
3. **专属页面名称**：「你在知识库里给这个 bot 创建的专属页面叫什么？」（例：🤖 researcher_mapping）
4. **常用简称**：「有没有其他简称需要 bot 理解的？没有可以跳过」
5. **常用资源**：「有常用的 bitable URL 或文档链接要记录吗？没有可以跳过」

每收到一个回答就更新 `docs/bot-context.md`，不要等全部收齐。

## Step 3: 更新 CLAUDE.md

如果 CLAUDE.md 中**不包含** "记忆与上下文" 字样，追加：

```markdown

## 记忆与上下文

- 新 session 开始时，读取 `docs/bot-context.md`（初始上下文）和 `memory/learnings.md`（经验）
- 用户纠正你时，追加到 `memory/learnings.md`（格式：`- [YYYY-MM-DD] 内容`）
- 对话结束时，追加摘要到 `logs/{YYYY-MM-DD}.md`（一两行即可）
- 创建飞书文档默认写到 wiki 专属页面下，不在本地创建文件
```

## Step 4: 确认

告诉用户：
- 已创建 `docs/bot-context.md`（初始上下文）
- 已创建 `memory/learnings.md`（经验记录）
- 已创建 `logs/` 目录（对话日志）
- CLAUDE.md 已添加记忆系统指令
- 如果 bot 已在运行，需要 `pm2 restart {daemon-name}` 或 `/feishu deploy` 重启生效
