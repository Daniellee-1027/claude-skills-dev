/**
 * Mention extraction and formatting.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/mention.ts.
 */

import type { FeishuMessageEvent } from "./bot.js";

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MentionTarget = {
  openId: string;
  name: string;
  key: string;
};

export function extractMentionTargets(
  event: FeishuMessageEvent,
  botOpenId?: string,
): MentionTarget[] {
  const mentions = event.message.mentions ?? [];
  return mentions
    .filter((m) => {
      if (botOpenId && m.id.open_id === botOpenId) return false;
      return !!m.id.open_id;
    })
    .map((m) => ({
      openId: m.id.open_id!,
      name: m.name,
      key: m.key,
    }));
}

export function isMentionForwardRequest(event: FeishuMessageEvent, botOpenId?: string): boolean {
  const mentions = event.message.mentions ?? [];
  if (mentions.length === 0) return false;
  const isDirectMessage = event.message.chat_type === "p2p";
  const hasOtherMention = mentions.some((m) => m.id.open_id !== botOpenId);
  if (isDirectMessage) return hasOtherMention;
  const hasBotMention = mentions.some((m) => m.id.open_id === botOpenId);
  return hasBotMention && hasOtherMention;
}

export function extractMessageBody(text: string, allMentionKeys: string[]): string {
  let result = text;
  for (const key of allMentionKeys) {
    result = result.replace(new RegExp(escapeRegExp(key), "g"), "");
  }
  return result.replace(/\s+/g, " ").trim();
}

export function formatMentionForText(target: MentionTarget): string {
  return `<at user_id="${target.openId}">${target.name}</at>`;
}

export function formatMentionForCard(target: MentionTarget): string {
  return `<at id=${target.openId}></at>`;
}

export function buildMentionedMessage(targets: MentionTarget[], message: string): string {
  if (targets.length === 0) return message;
  const mentionParts = targets.map((t) => formatMentionForText(t));
  return `${mentionParts.join(" ")} ${message}`;
}

export function buildMentionedCardContent(targets: MentionTarget[], message: string): string {
  if (targets.length === 0) return message;
  const mentionParts = targets.map((t) => formatMentionForCard(t));
  return `${mentionParts.join(" ")} ${message}`;
}
