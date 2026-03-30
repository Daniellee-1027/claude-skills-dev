# Feishu Bridge Logs

1. Derive daemon name: `feishu-bot-{basename of current directory}`
2. Run `pm2 logs {name} --lines 50 --nostream`
3. Show the output to the user
4. If the process doesn't exist, tell the user no bot is running for this folder
