/**
 * Reply dispatcher for feishu bridge.
 * Simplified from openclaw/feishu/src/reply-dispatcher.ts.
 * Uses streaming cards for real-time output, falls back to text messages.
 */
import type { Client } from "@larksuiteoapi/node-sdk";
import type { BridgeConfig } from "../config.js";
import type { MentionTarget } from "./mention.js";
export type BridgeReplyDispatcher = {
    onPartialText: (text: string) => void;
    onComplete: (text: string, segments: string[], toolCalls: string[], durationMs: number) => Promise<void>;
    onError: (error: unknown) => Promise<void>;
    onAbort: () => Promise<void>;
};
export declare function createBridgeReplyDispatcher(params: {
    client: Client;
    config: BridgeConfig;
    chatId: string;
    replyToMessageId?: string;
    mentionTargets?: MentionTarget[];
    log: (...args: any[]) => void;
}): BridgeReplyDispatcher;
