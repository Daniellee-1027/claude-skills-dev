/**
 * Message sending functions for feishu bridge.
 * Simplified from openclaw/feishu/src/send.ts — no OpenClaw runtime dependency.
 */
import type { Client } from "@larksuiteoapi/node-sdk";
import type { MentionTarget } from "./mention.js";
import type { FeishuSendResult } from "./types.js";
export type FeishuMessageInfo = {
    messageId: string;
    chatId: string;
    senderId?: string;
    senderOpenId?: string;
    content: string;
    contentType: string;
    createTime?: number;
};
export declare function getMessageFeishu(params: {
    client: Client;
    messageId: string;
}): Promise<FeishuMessageInfo | null>;
export declare function sendMessageFeishu(params: {
    client: Client;
    to: string;
    text: string;
    replyToMessageId?: string;
    mentions?: MentionTarget[];
}): Promise<FeishuSendResult>;
export declare function buildMarkdownCard(text: string): Record<string, unknown>;
export declare function buildFormattedCard(params: {
    answer: string;
    toolCalls?: string[];
    durationMs?: number;
}): Record<string, unknown>;
/** Summary-only card: just tool calls + duration, no answer text (answer goes in a separate post message for copyability) */
export declare function buildSummaryCard(params: {
    toolCalls?: string[];
    durationMs?: number;
}): Record<string, unknown>;
export declare function sendMarkdownCardFeishu(params: {
    client: Client;
    to: string;
    text: string;
    replyToMessageId?: string;
    mentions?: MentionTarget[];
}): Promise<FeishuSendResult>;
export declare function updateCardFeishu(params: {
    client: Client;
    messageId: string;
    card: Record<string, unknown>;
}): Promise<void>;
