# Initialize Feishu Tool Docs

为当前项目文件夹生成飞书工具使用文档，让部署的 bot 知道怎么用飞书工具。

## Step 1: 复制文档

把以下 4 个文档模板复制到当前项目的 `docs/` 目录：

1. 读取 `~/.claude/skills/feishu/docs/feishu-doc.md` → 写入 `{cwd}/docs/feishu-doc.md`
2. 读取 `~/.claude/skills/feishu/docs/feishu-wiki.md` → 写入 `{cwd}/docs/feishu-wiki.md`
3. 读取 `~/.claude/skills/feishu/docs/feishu-bitable.md` → 写入 `{cwd}/docs/feishu-bitable.md`
4. 读取 `~/.claude/skills/feishu/docs/feishu-drive.md` → 写入 `{cwd}/docs/feishu-drive.md`

如果 `docs/` 目录不存在，先创建。

## Step 1.5: 初始化上下文和记忆结构

- 复制 `~/.claude/skills/feishu/docs/bot-context-template.md` → `{cwd}/docs/bot-context.md`（仅当不存在时）
- 创建 `{cwd}/memory/learnings.md`（仅当不存在时，内容：`# Bot 经验记录\n\n`）
- 创建 `{cwd}/logs/` 目录（仅当不存在时）
- 提醒用户编辑 `docs/bot-context.md` 填入实际信息（称呼、知识库名称、专属页面名称）

## Step 2: 更新 CLAUDE.md

检查当前项目的 `CLAUDE.md`（如果不存在则创建）。

如果 CLAUDE.md 中**不包含** "飞书工具使用指南" 字样，追加以下内容：

```markdown

## 飞书工具使用指南

始终使用中文回复用户。回答要简洁直接，不要自言自语或解释自己的思考过程。

你有以下飞书工具可以直接调用，不需要检查配置或状态，直接用就行。
当用户提到知识库、wiki、文档、表格时，直接调用对应工具，不要去读本地配置文件或检查自己的能力。

**详细用法参考（需要时读取对应文件）：**

- `docs/feishu-wiki.md` — 知识库：spaces → nodes → get 逐级浏览（不支持搜索）
- `docs/feishu-doc.md` — 文档：读写用 Markdown，支持 block 级操作
- `docs/feishu-bitable.md` — 多维表格：9 个独立工具，字段类型编号参考
- `docs/feishu-drive.md` — 云空间：文件夹增删移

### 快速参考

| 场景 | 操作步骤 |
|------|----------|
| 访问知识库 | `feishu_wiki` spaces → nodes(space_id) → get(node_token) → `feishu_doc` read(obj_token) |
| 读写文档 | `feishu_doc` read/write/append，content 用 Markdown 格式 |
| 操作多维表格 | `feishu_bitable_get_meta`(url) → `list_fields` → `list_records` / `create_record` / `update_record` |
| 管理云空间文件 | `feishu_drive` list → info / create_folder / move / delete |

## 记忆与上下文

- 新 session 开始时，读取 `docs/bot-context.md`（初始上下文）和 `memory/learnings.md`（经验）
- 用户纠正你时，追加到 `memory/learnings.md`（格式：`- [YYYY-MM-DD] 内容`）
- 对话结束时，追加摘要到 `logs/{YYYY-MM-DD}.md`（一两行即可）
- 创建飞书文档默认写到 wiki 专属页面下，不在本地创建文件
```

如果已包含 "飞书工具使用指南"，告诉用户文档已存在，跳过。

## Step 3: 确认

告诉用户：
- 已生成 4 个飞书工具文档到 `docs/` 目录
- 已在 CLAUDE.md 中添加工具索引
- bot 现在可以通过读取这些文档了解飞书工具的详细用法
- 如果 bot 已在运行，需要 `/feishu deploy` 重启生效
