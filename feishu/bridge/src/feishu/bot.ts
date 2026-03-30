/**
 * Feishu message handler for bridge daemon.
 * Adapted from openclaw/feishu/src/bot.ts — replaces OpenClaw dispatch with
 * Claude Agent SDK session manager.
 */

import type { Client } from "@larksuiteoapi/node-sdk";
import type { BridgeConfig } from "../config.js";
import type { SessionManager } from "../session-manager.js";
import { tryRecordMessage } from "./dedup.js";
import {
  escapeRegExp,
  extractMentionTargets,
  extractMessageBody,
  isMentionForwardRequest,
} from "./mention.js";
import { isGroupAllowed, shouldRequireMention } from "./policy.js";
import { createBridgeReplyDispatcher } from "./reply-dispatcher.js";
import { getMessageFeishu, sendMessageFeishu } from "./send.js";
import type { FeishuMessageContext } from "./types.js";

// --- Sender name resolution ---
const SENDER_NAME_TTL_MS = 10 * 60 * 1000;
const senderNameCache = new Map<string, { name: string; expireAt: number }>();

async function resolveFeishuSenderName(params: {
  client: Client;
  senderOpenId: string;
  log: (...args: any[]) => void;
}): Promise<string | undefined> {
  const { client, senderOpenId, log } = params;
  if (!senderOpenId) return undefined;

  const cached = senderNameCache.get(senderOpenId);
  const now = Date.now();
  if (cached && cached.expireAt > now) return cached.name;

  try {
    const res: any = await client.contact.user.get({
      path: { user_id: senderOpenId },
      params: { user_id_type: "open_id" },
    });
    const name: string | undefined =
      res?.data?.user?.name ||
      res?.data?.user?.display_name ||
      res?.data?.user?.nickname ||
      res?.data?.user?.en_name;

    if (name && typeof name === "string") {
      senderNameCache.set(senderOpenId, { name, expireAt: now + SENDER_NAME_TTL_MS });
      return name;
    }
    return undefined;
  } catch (err) {
    log(`feishu: failed to resolve sender name for ${senderOpenId}: ${String(err)}`);
    return undefined;
  }
}

// --- Event types ---

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
      id: { open_id?: string; user_id?: string; union_id?: string };
      name: string;
      tenant_key?: string;
    }>;
  };
};

// --- Message content parsing ---

function parseMessageContent(content: string, messageType: string): string {
  try {
    const parsed = JSON.parse(content);
    if (messageType === "text") return parsed.text || "";
    if (messageType === "post") return parsePostContent(content).textContent;
    return content;
  } catch {
    return content;
  }
}

function parsePostContent(content: string): {
  textContent: string;
  mentionedOpenIds: string[];
} {
  try {
    const parsed = JSON.parse(content);
    const title = parsed.title || "";
    const contentBlocks = parsed.content || [];
    let textContent = title ? `${title}\n\n` : "";
    const mentionedOpenIds: string[] = [];

    for (const paragraph of contentBlocks) {
      if (Array.isArray(paragraph)) {
        for (const element of paragraph) {
          if (element.tag === "text") textContent += element.text || "";
          else if (element.tag === "a") textContent += element.text || element.href || "";
          else if (element.tag === "at") {
            textContent += `@${element.user_name || element.user_id || ""}`;
            if (element.user_id) mentionedOpenIds.push(element.user_id);
          }
        }
        textContent += "\n";
      }
    }

    return {
      textContent: textContent.trim() || "[Rich text message]",
      mentionedOpenIds,
    };
  } catch {
    return { textContent: "[Rich text message]", mentionedOpenIds: [] };
  }
}

function checkBotMentioned(event: FeishuMessageEvent, botOpenId?: string): boolean {
  if (!botOpenId) return false;
  const mentions = event.message.mentions ?? [];
  if (mentions.length > 0) return mentions.some((m) => m.id.open_id === botOpenId);
  if (event.message.message_type === "post") {
    const { mentionedOpenIds } = parsePostContent(event.message.content);
    return mentionedOpenIds.some((id) => id === botOpenId);
  }
  return false;
}

function stripBotMention(
  text: string,
  mentions?: FeishuMessageEvent["message"]["mentions"],
): string {
  if (!mentions || mentions.length === 0) return text;
  let result = text;
  for (const mention of mentions) {
    result = result.replace(new RegExp(`@${escapeRegExp(mention.name)}\\s*`, "g"), "");
    result = result.replace(new RegExp(escapeRegExp(mention.key), "g"), "");
  }
  return result.trim();
}

export function parseFeishuMessageEvent(
  event: FeishuMessageEvent,
  botOpenId?: string,
): FeishuMessageContext {
  const rawContent = parseMessageContent(event.message.content, event.message.message_type);
  const mentionedBot = checkBotMentioned(event, botOpenId);
  const content = stripBotMention(rawContent, event.message.mentions);

  const ctx: FeishuMessageContext = {
    chatId: event.message.chat_id,
    messageId: event.message.message_id,
    senderId: event.sender.sender_id.user_id || event.sender.sender_id.open_id || "",
    senderOpenId: event.sender.sender_id.open_id || "",
    chatType: event.message.chat_type,
    mentionedBot,
    rootId: event.message.root_id || undefined,
    parentId: event.message.parent_id || undefined,
    content,
    contentType: event.message.message_type,
  };

  if (isMentionForwardRequest(event, botOpenId)) {
    const mentionTargets = extractMentionTargets(event, botOpenId);
    if (mentionTargets.length > 0) {
      ctx.mentionTargets = mentionTargets;
      const allMentionKeys = (event.message.mentions ?? []).map((m) => m.key);
      ctx.mentionMessageBody = extractMessageBody(content, allMentionKeys);
    }
  }

  return ctx;
}

// --- Chat history for group context ---
const chatHistories = new Map<string, Array<{ sender: string; body: string; timestamp: number }>>();
const MAX_HISTORY = 20;

function recordHistory(chatId: string, sender: string, body: string) {
  let history = chatHistories.get(chatId);
  if (!history) {
    history = [];
    chatHistories.set(chatId, history);
  }
  history.push({ sender, body, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.shift();
}

function getAndClearHistory(chatId: string): string {
  const history = chatHistories.get(chatId);
  if (!history || history.length === 0) return "";
  const text = history.map((h) => `${h.sender}: ${h.body}`).join("\n");
  chatHistories.delete(chatId);
  return text;
}

// --- Main handler ---

export async function handleFeishuMessage(params: {
  config: BridgeConfig;
  client: Client;
  event: FeishuMessageEvent;
  botOpenId?: string;
  sessionManager: SessionManager;
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
}): Promise<void> {
  const { config, client, event, botOpenId, sessionManager, log, error } = params;

  // Dedup
  const messageId = event.message.message_id;
  if (!tryRecordMessage(messageId)) {
    log(`feishu: skipping duplicate message ${messageId}`);
    return;
  }

  let ctx = parseFeishuMessageEvent(event, botOpenId);
  const isGroup = ctx.chatType === "group";

  // Resolve sender name
  const senderName = await resolveFeishuSenderName({
    client,
    senderOpenId: ctx.senderOpenId,
    log,
  });
  if (senderName) ctx = { ...ctx, senderName };

  log(`feishu: received message from ${ctx.senderOpenId} in ${ctx.chatId} (${ctx.chatType})`);

  // Group access control
  if (isGroup) {
    const groupAllowed = isGroupAllowed({
      groupPolicy: config.feishu.groupPolicy,
      allowFrom: config.feishu.groupAllowFrom ?? [],
      id: ctx.chatId,
    });
    if (!groupAllowed) {
      log(`feishu: group ${ctx.chatId} not allowed`);
      return;
    }

    // Require mention check
    if (shouldRequireMention(config, true) && !ctx.mentionedBot) {
      log(`feishu: message in group ${ctx.chatId} did not mention bot, recording history`);
      recordHistory(ctx.chatId, ctx.senderName ?? ctx.senderOpenId, ctx.content);
      return;
    }
  } else {
    // DM access control
    if (config.feishu.dmPolicy === "allowlist") {
      const allowed = (config.feishu.allowFrom ?? []).some(
        (id) =>
          id === "*" ||
          id.toLowerCase() === ctx.senderOpenId.toLowerCase(),
      );
      if (!allowed) {
        log(`feishu: sender ${ctx.senderOpenId} not in DM allowlist`);
        return;
      }
    }
  }

  // Slash command interception
  if (ctx.content.startsWith("/")) {
    // Session key (same logic as below)
    const slashSessionKey = isGroup
      ? ctx.rootId
        ? `group:${ctx.chatId}:topic:${ctx.rootId}`
        : `group:${ctx.chatId}`
      : `dm:${ctx.senderOpenId}`;

    const result = sessionManager.handleSlashCommand(slashSessionKey, ctx.content);
    if (result.handled && result.response) {
      try {
        await sendMessageFeishu({
          client,
          to: ctx.chatId,
          text: result.response,
          replyToMessageId: ctx.messageId,
        });
      } catch (err) {
        error(`feishu: failed to send slash command response: ${String(err)}`);
      }
      return;
    }
    // If not handled, fall through to Claude
  }

  try {
    // Fetch quoted message if replying
    let quotedContent: string | undefined;
    if (ctx.parentId) {
      try {
        const quotedMsg = await getMessageFeishu({ client, messageId: ctx.parentId });
        if (quotedMsg) quotedContent = quotedMsg.content;
      } catch (err) {
        log(`feishu: failed to fetch quoted message: ${String(err)}`);
      }
    }

    // Build message for Claude
    let messageBody = ctx.content;
    if (quotedContent) {
      messageBody = `[Replying to: "${quotedContent}"]\n\n${ctx.content}`;
    }

    const speaker = ctx.senderName ?? ctx.senderOpenId;
    messageBody = `${speaker}: ${messageBody}`;

    if (ctx.mentionTargets && ctx.mentionTargets.length > 0) {
      const targetNames = ctx.mentionTargets.map((t) => t.name).join(", ");
      messageBody += `\n\n[System: Your reply will automatically @mention: ${targetNames}. Do not write @xxx yourself.]`;
    }

    // Prepend group history if available
    if (isGroup) {
      const history = getAndClearHistory(ctx.chatId);
      if (history) {
        messageBody = `[Recent chat history]\n${history}\n\n[Current message]\n${messageBody}`;
      }
    }

    // Session key
    const sessionKey = isGroup
      ? ctx.rootId
        ? `group:${ctx.chatId}:topic:${ctx.rootId}`
        : `group:${ctx.chatId}`
      : `dm:${ctx.senderOpenId}`;

    // Create reply dispatcher
    const replyDispatcher = createBridgeReplyDispatcher({
      client,
      config,
      chatId: ctx.chatId,
      replyToMessageId: ctx.messageId,
      mentionTargets: ctx.mentionTargets,
      log,
    });

    // Dispatch to Claude via session manager
    await sessionManager.handleMessage({
      sessionKey,
      message: messageBody,
      onText: (text) => replyDispatcher.onPartialText(text),
      onComplete: (text, segments, toolCalls, durationMs) =>
        replyDispatcher.onComplete(text, segments, toolCalls, durationMs),
      onError: async (err) => {
        error(`feishu: Claude error for session ${sessionKey}: ${String(err)}`);
        await replyDispatcher.onError(err);
      },
      onAbort: async () => {
        log(`feishu: query aborted for session ${sessionKey}`);
        await replyDispatcher.onAbort();
      },
    });

    log(`feishu: dispatch complete for session ${sessionKey}`);
  } catch (err) {
    error(`feishu: failed to dispatch message: ${String(err)}`);
  }
}
