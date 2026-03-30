/**
 * Feishu message handler for bridge daemon.
 * Adapted from openclaw/feishu/src/bot.ts — replaces OpenClaw dispatch with
 * Claude Agent SDK session manager.
 */
import type { Client } from "@larksuiteoapi/node-sdk";
import type { BridgeConfig } from "../config.js";
import type { SessionManager } from "../session-manager.js";
import type { FeishuMessageContext } from "./types.js";
export type FeishuMessageEvent = {
    sender: {
        sender_id: {
            open_id?: string;
            user_id?: string;
            union_id?: string;
        };
        sender_type?: string;
        tenant_key?: string;
    };
    message: {
        message_id: string;
        root_id?: string;
        parent_id?: string;
        chat_id: string;
        chat_type: "p2p" | "group";
        message_type: string;
        content: string;
        mentions?: Array<{
            key: string;
            id: {
                open_id?: string;
                user_id?: string;
                union_id?: string;
            };
            name: string;
            tenant_key?: string;
        }>;
    };
};
export declare function parseFeishuMessageEvent(event: FeishuMessageEvent, botOpenId?: string): FeishuMessageContext;
export declare function handleFeishuMessage(params: {
    config: BridgeConfig;
    client: Client;
    event: FeishuMessageEvent;
    botOpenId?: string;
    sessionManager: SessionManager;
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
}): Promise<void>;
