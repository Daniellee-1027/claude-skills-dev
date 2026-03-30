/**
 * Feishu event monitor (WebSocket / Webhook).
 * Adapted from openclaw/feishu/src/monitor.ts — simplified for bridge daemon.
 */
import * as http from "node:http";
import * as Lark from "@larksuiteoapi/node-sdk";
import { handleFeishuMessage } from "./bot.js";
import { createFeishuClient, createFeishuWSClient, createEventDispatcher } from "./client.js";
let botOpenId;
async function fetchBotOpenId(config) {
    try {
        const client = createFeishuClient(config.feishu);
        const res = await client.bot.info({});
        return res?.data?.bot?.open_id;
    }
    catch {
        return undefined;
    }
}
export async function startMonitor(params) {
    const { config, sessionManager, abortSignal, log, error } = params;
    const client = createFeishuClient(config.feishu);
    // Fetch bot open_id
    botOpenId = await fetchBotOpenId(config);
    log(`feishu: bot open_id resolved: ${botOpenId ?? "unknown"}`);
    const eventDispatcher = createEventDispatcher(config.feishu);
    // Register event handlers
    eventDispatcher.register({
        "im.message.receive_v1": async (data) => {
            try {
                const event = data;
                await handleFeishuMessage({
                    config,
                    client,
                    event,
                    botOpenId,
                    sessionManager,
                    log,
                    error,
                });
            }
            catch (err) {
                error(`feishu: error handling message: ${String(err)}`);
            }
        },
        "im.message.message_read_v1": async () => { },
        "im.chat.member.bot.added_v1": async (data) => {
            const event = data;
            log(`feishu: bot added to chat ${event.chat_id}`);
        },
        "im.chat.member.bot.deleted_v1": async (data) => {
            const event = data;
            log(`feishu: bot removed from chat ${event.chat_id}`);
        },
    });
    const connectionMode = config.feishu.connectionMode;
    if (connectionMode === "webhook") {
        return startWebhook({ config, eventDispatcher, abortSignal, log, error });
    }
    return startWebSocket({ config, eventDispatcher, abortSignal, log, error });
}
async function startWebSocket(params) {
    const { config, eventDispatcher, abortSignal, log } = params;
    log("feishu: starting WebSocket connection...");
    const wsClient = createFeishuWSClient(config.feishu);
    return new Promise((resolve, reject) => {
        const handleAbort = () => {
            log("feishu: abort signal received, stopping");
            resolve();
        };
        if (abortSignal?.aborted) {
            resolve();
            return;
        }
        abortSignal?.addEventListener("abort", handleAbort, { once: true });
        try {
            wsClient.start({ eventDispatcher });
            log("feishu: WebSocket client started");
        }
        catch (err) {
            abortSignal?.removeEventListener("abort", handleAbort);
            reject(err);
        }
    });
}
async function startWebhook(params) {
    const { config, eventDispatcher, abortSignal, log, error: logError } = params;
    const port = config.feishu.webhookPort ?? 3000;
    const path = config.feishu.webhookPath ?? "/feishu/events";
    const host = config.feishu.webhookHost ?? "127.0.0.1";
    log(`feishu: starting Webhook server on ${host}:${port}, path ${path}...`);
    const server = http.createServer();
    const webhookHandler = Lark.adaptDefault(path, eventDispatcher, { autoChallenge: true });
    server.on("request", (req, res) => {
        void Promise.resolve(webhookHandler(req, res)).catch((err) => {
            logError(`feishu: webhook handler error: ${String(err)}`);
        });
    });
    return new Promise((resolve, reject) => {
        const handleAbort = () => {
            log("feishu: abort signal received, stopping Webhook server");
            server.close();
            resolve();
        };
        if (abortSignal?.aborted) {
            resolve();
            return;
        }
        abortSignal?.addEventListener("abort", handleAbort, { once: true });
        server.listen(port, host, () => {
            log(`feishu: Webhook server listening on ${host}:${port}`);
        });
        server.on("error", (err) => {
            logError(`feishu: Webhook server error: ${err}`);
            abortSignal?.removeEventListener("abort", handleAbort);
            reject(err);
        });
    });
}
//# sourceMappingURL=monitor.js.map