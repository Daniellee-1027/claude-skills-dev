/**
 * Feishu Streaming Card — Card Kit streaming API for real-time text output.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/streaming-card.ts.
 */
import type { Client } from "@larksuiteoapi/node-sdk";
import type { FeishuDomain } from "./types.js";
type Credentials = {
    appId: string;
    appSecret: string;
    domain?: FeishuDomain;
};
export declare class FeishuStreamingSession {
    private client;
    private creds;
    private state;
    private queue;
    private closed;
    private log?;
    private lastUpdateTime;
    private pendingText;
    private updateThrottleMs;
    constructor(client: Client, creds: Credentials, log?: (msg: string) => void);
    start(receiveId: string, receiveIdType?: "open_id" | "user_id" | "union_id" | "email" | "chat_id"): Promise<void>;
    private updateCardContent;
    update(text: string): Promise<void>;
    close(finalText?: string): Promise<void>;
    closeWithFormattedCard(params: {
        answer: string;
        toolCalls?: string[];
        durationMs?: number;
    }): Promise<void>;
    /** Close streaming and replace card with a summary-only card (no answer text, just tool calls + duration) */
    closeWithSummaryCard(params: {
        toolCalls?: string[];
        durationMs?: number;
    }): Promise<void>;
    /** Delete the streaming card message entirely */
    deleteMessage(): Promise<void>;
    isActive(): boolean;
}
export {};
