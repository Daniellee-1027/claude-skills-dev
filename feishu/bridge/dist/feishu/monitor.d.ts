/**
 * Feishu event monitor (WebSocket / Webhook).
 * Adapted from openclaw/feishu/src/monitor.ts — simplified for bridge daemon.
 */
import type { BridgeConfig } from "../config.js";
import type { SessionManager } from "../session-manager.js";
export declare function startMonitor(params: {
    config: BridgeConfig;
    sessionManager: SessionManager;
    abortSignal?: AbortSignal;
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
}): Promise<void>;
