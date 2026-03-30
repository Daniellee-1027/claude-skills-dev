# Deploy Feishu Bridge

Follow these steps exactly:

## Step 1: Check prerequisites

1. Check if `~/.claude/skills/feishu/bridge/node_modules/` exists
   - If not → run `cd ~/.claude/skills/feishu/bridge && npm install`
2. Check if `pm2` is available (`which pm2`)
   - If not → run `npm install -g pm2`
3. Note the current working directory — this is the project folder that will become the bot's identity

## Step 2: Configuration

Check if `feishu.config.json` exists in the current working directory.

**If it doesn't exist**, create it with this template and tell the user to fill in appId and appSecret:

```json
{
  "feishu": {
    "appId": "",
    "appSecret": "",
    "domain": "feishu",
    "connectionMode": "websocket",
    "requireMention": true,
    "dmPolicy": "open",
    "groupPolicy": "open",
    "tools": {
      "doc": true,
      "wiki": true,
      "bitable": true,
      "drive": true,
      "perm": false
    }
  },
  "claude": {
    "model": "claude-sonnet-4-20250514",
    "sessionTtlMs": 1800000,
    "permissionMode": "bypassPermissions"
  }
}
```

Tell the user:
- Go to 飞书开放平台 (https://open.feishu.cn) → 创建应用 → 获取 App ID 和 App Secret
- Fill them into `feishu.config.json`
- Enable these scopes: im:message, im:message:send_as_bot, im:resource, contact:user.base:readonly
- For doc/wiki/bitable tools, also enable: docx:document, wiki:wiki, bitable:app, drive:drive
- Enable WebSocket in 事件订阅 → 使用长连接接收事件
- Then run `/feishu deploy` again

**Stop here if config was just created (appId is empty).**

## Step 3: Validate config

Read `feishu.config.json` and verify:
- `feishu.appId` is non-empty
- `feishu.appSecret` is non-empty

If either is empty, tell the user to fill them in and stop.

## Step 3.5: Initialize tool docs

Check if `docs/feishu-wiki.md` exists in the current working directory.

If it doesn't exist, automatically run the init-docs flow:

1. Create `docs/` directory if needed
2. Copy the 4 doc files from `~/.claude/skills/feishu/docs/` to `{cwd}/docs/`:
   - `feishu-doc.md`, `feishu-wiki.md`, `feishu-bitable.md`, `feishu-drive.md`
3. Check if CLAUDE.md contains "飞书工具使用指南"
   - If not, read `~/.claude/skills/feishu/init-docs.md` for the content block to append to CLAUDE.md
   - Append the 飞书工具使用指南 section (including 快速参考 table)
   - Also prepend `始终使用中文回复用户。回答要简洁直接，不要自言自语或解释自己的思考过程。` near the top of CLAUDE.md if not already present

If docs already exist, skip this step.

## Step 4: Start daemon

Derive the daemon name from the current folder: `feishu-bot-{basename of cwd}`

Check if a pm2 process with this name already exists (`pm2 describe feishu-bot-xxx`).
- If running → ask user if they want to restart. If yes, `pm2 restart {name}`. If no, stop.

If not running, start:

```bash
pm2 start ~/.claude/skills/feishu/bridge/src/index.ts \
  --name "feishu-bot-$(basename $PWD)" \
  --interpreter npx \
  --interpreter-args "tsx" \
  -- --cwd "$(pwd)" --config "$(pwd)/feishu.config.json"
```

## Step 5: Verify

Run `pm2 status` and check the process is "online".

If online, tell the user:
- Bot is running! Try sending a message to the bot in Feishu.
- Use `/feishu logs` to check logs if something goes wrong.
- Use `/feishu stop` to stop the bot.

If errored, run `pm2 logs feishu-bot-xxx --lines 20` and show the error.
