#!/usr/bin/env node
/**
 * Feishu Bridge Daemon — entry point.
 *
 * Usage:
 *   npx tsx src/index.ts --cwd /path/to/project --config /path/to/feishu.config.json
 *
 * Launched via pm2:
 *   pm2 start src/index.ts --name "feishu-bot-myproject" \
 *     --interpreter npx --interpreter-args "tsx" \
 *     -- --cwd /path/to/project --config /path/to/project/feishu.config.json
 */
export {};
