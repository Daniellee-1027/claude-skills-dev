# Switch Feishu Bridge Model

1. Read `feishu.config.json` in the current project directory
2. Show the current model (`claude.model` field)
3. If `$ARGUMENTS` contains a model name after "model" (e.g. `/feishu model opus`), update the model:
   - Supported aliases: `sonnet` → `claude-sonnet-4-6`, `opus` → `claude-opus-4-6`, `haiku` → `claude-haiku-4-5-20251001`
   - Also accepts full model IDs directly
   - Update `claude.model` in `feishu.config.json`
   - Restart the bridge: `pkill -f 'feishu/bridge/src/index.ts'` (the daemon will auto-restart)
   - Confirm the change to the user
4. If no model name provided, just display:
   - Current model
   - Available aliases: sonnet / opus / haiku
