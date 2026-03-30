# Stop Feishu Bridge

1. Derive daemon name: `feishu-bot-{basename of current directory}`
2. Run `pm2 stop {name}` then `pm2 delete {name}`
3. Confirm to user that the bot has been stopped

If the process doesn't exist, tell the user no bot is running for this folder.
