# Feishu Bridge Status

1. Run `pm2 list` and filter for processes with names starting with `feishu-bot-`
2. Display a summary table showing:
   - Name
   - Status (online/stopped/errored)
   - Uptime
   - Restarts
   - CPU/Memory
3. If no feishu-bot processes found, tell the user no bots are running
