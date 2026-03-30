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
import { loadConfig } from "./config.js";
import { createSessionManager } from "./session-manager.js";
import { startMonitor } from "./feishu/monitor.js";
function parseArgs(argv) {
    let cwd = process.cwd();
    let config = "";
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === "--cwd" && argv[i + 1]) {
            cwd = argv[++i];
        }
        else if (argv[i] === "--config" && argv[i + 1]) {
            config = argv[++i];
        }
    }
    if (!config) {
        throw new Error("Missing required --config argument");
    }
    return { cwd, config };
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const log = (...msgs) => console.log(`[${new Date().toISOString()}]`, ...msgs);
    const error = (...msgs) => console.error(`[${new Date().toISOString()}]`, ...msgs);
    log(`feishu-bridge: starting`);
    log(`  cwd: ${args.cwd}`);
    log(`  config: ${args.config}`);
    // Load config
    const config = loadConfig(args.config);
    log(`feishu-bridge: config loaded (appId=${config.feishu.appId.slice(0, 8)}...)`);
    // Create session manager
    const sessionManager = createSessionManager({
        config,
        projectDir: args.cwd,
        log,
    });
    log(`feishu-bridge: session manager created`);
    // Handle graceful shutdown
    const abortController = new AbortController();
    process.on("SIGINT", () => {
        log("feishu-bridge: received SIGINT, shutting down...");
        abortController.abort();
    });
    process.on("SIGTERM", () => {
        log("feishu-bridge: received SIGTERM, shutting down...");
        abortController.abort();
    });
    // Start monitoring feishu events
    log(`feishu-bridge: connecting to feishu (mode=${config.feishu.connectionMode})...`);
    try {
        await startMonitor({
            config,
            sessionManager,
            abortSignal: abortController.signal,
            log,
            error,
        });
    }
    catch (err) {
        error(`feishu-bridge: fatal error: ${String(err)}`);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error(`feishu-bridge: unhandled error: ${String(err)}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map