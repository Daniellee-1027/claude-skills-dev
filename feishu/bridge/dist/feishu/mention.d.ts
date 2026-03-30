/**
 * Mention extraction and formatting.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/mention.ts.
 */
import type { FeishuMessageEvent } from "./bot.js";
export declare function escapeRegExp(input: string): string;
export type MentionTarget = {
    openId: string;
    name: string;
    key: string;
};
export declare function extractMentionTargets(event: FeishuMessageEvent, botOpenId?: string): MentionTarget[];
export declare function isMentionForwardRequest(event: FeishuMessageEvent, botOpenId?: string): boolean;
export declare function extractMessageBody(text: string, allMentionKeys: string[]): string;
export declare function formatMentionForText(target: MentionTarget): string;
export declare function formatMentionForCard(target: MentionTarget): string;
export declare function buildMentionedMessage(targets: MentionTarget[], message: string): string;
export declare function buildMentionedCardContent(targets: MentionTarget[], message: string): string;
