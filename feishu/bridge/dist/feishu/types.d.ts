/**
 * Type definitions for feishu bridge.
 * Simplified from openclaw/feishu, removing OpenClaw dependencies.
 */
import type { MentionTarget } from "./mention.js";
export type FeishuDomain = "feishu" | "lark" | (string & {});
export type FeishuMessageContext = {
    chatId: string;
    messageId: string;
    senderId: string;
    senderOpenId: string;
    senderName?: string;
    chatType: "p2p" | "group";
    mentionedBot: boolean;
    rootId?: string;
    parentId?: string;
    content: string;
    contentType: string;
    mentionTargets?: MentionTarget[];
    mentionMessageBody?: string;
};
export type FeishuSendResult = {
    messageId: string;
    chatId: string;
};
export type FeishuToolsConfig = {
    doc?: boolean;
    wiki?: boolean;
    drive?: boolean;
    perm?: boolean;
};
