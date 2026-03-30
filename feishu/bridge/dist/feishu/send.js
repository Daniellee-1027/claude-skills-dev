/**
 * Message sending functions for feishu bridge.
 * Simplified from openclaw/feishu/src/send.ts — no OpenClaw runtime dependency.
 */
import { buildMentionedMessage, buildMentionedCardContent } from "./mention.js";
import { assertFeishuMessageApiSuccess, toFeishuSendResult } from "./send-result.js";
import { resolveReceiveIdType, normalizeFeishuTarget } from "./targets.js";
export async function getMessageFeishu(params) {
    const { client, messageId } = params;
    try {
        const response = (await client.im.message.get({
            path: { message_id: messageId },
        }));
        if (response.code !== 0)
            return null;
        const item = response.data?.items?.[0];
        if (!item)
            return null;
        let content = item.body?.content ?? "";
        try {
            const parsed = JSON.parse(content);
            if (item.msg_type === "text" && parsed.text)
                content = parsed.text;
        }
        catch { }
        return {
            messageId: item.message_id ?? messageId,
            chatId: item.chat_id ?? "",
            senderId: item.sender?.id,
            senderOpenId: item.sender?.id_type === "open_id" ? item.sender?.id : undefined,
            content,
            contentType: item.msg_type ?? "text",
            createTime: item.create_time ? parseInt(item.create_time, 10) : undefined,
        };
    }
    catch {
        return null;
    }
}
function buildFeishuPostMessagePayload(messageText) {
    return {
        content: JSON.stringify({
            zh_cn: {
                content: [[{ tag: "md", text: messageText }]],
            },
        }),
        msgType: "post",
    };
}
export async function sendMessageFeishu(params) {
    const { client, to, text, replyToMessageId, mentions } = params;
    const receiveId = normalizeFeishuTarget(to);
    if (!receiveId)
        throw new Error(`Invalid Feishu target: ${to}`);
    const receiveIdType = resolveReceiveIdType(receiveId);
    let rawText = text ?? "";
    if (mentions && mentions.length > 0) {
        rawText = buildMentionedMessage(mentions, rawText);
    }
    const { content, msgType } = buildFeishuPostMessagePayload(rawText);
    if (replyToMessageId) {
        const response = await client.im.message.reply({
            path: { message_id: replyToMessageId },
            data: { content, msg_type: msgType },
        });
        assertFeishuMessageApiSuccess(response, "Feishu reply failed");
        return toFeishuSendResult(response, receiveId);
    }
    const response = await client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: { receive_id: receiveId, content, msg_type: msgType },
    });
    assertFeishuMessageApiSuccess(response, "Feishu send failed");
    return toFeishuSendResult(response, receiveId);
}
export function buildMarkdownCard(text) {
    return {
        schema: "2.0",
        config: { wide_screen_mode: true },
        body: {
            elements: [{ tag: "markdown", content: text }],
        },
    };
}
export function buildFormattedCard(params) {
    const { answer, toolCalls, durationMs } = params;
    const elements = [];
    // 答案内容
    elements.push({ tag: "markdown", content: answer });
    // 耗时统计
    if (durationMs !== undefined) {
        elements.push({ tag: "hr" });
        elements.push({
            tag: "markdown",
            content: `<font color="grey">⏱ ${(durationMs / 1000).toFixed(1)}s</font>`,
        });
    }
    return {
        schema: "2.0",
        config: { wide_screen_mode: true },
        header: {
            template: "green",
            title: { content: "🟢 Complete", tag: "plain_text" },
        },
        body: { elements },
    };
}
/** Summary-only card: just tool calls + duration, no answer text (answer goes in a separate post message for copyability) */
export function buildSummaryCard(params) {
    const { toolCalls, durationMs } = params;
    const elements = [];
    if (durationMs !== undefined) {
        elements.push({
            tag: "markdown",
            content: `<font color="grey">⏱ ${(durationMs / 1000).toFixed(1)}s</font>`,
        });
    }
    // Fallback if no elements
    if (elements.length === 0) {
        elements.push({ tag: "markdown", content: "✅ Complete" });
    }
    return {
        schema: "2.0",
        config: { wide_screen_mode: true },
        header: {
            template: "green",
            title: { content: "🟢 Complete", tag: "plain_text" },
        },
        body: { elements },
    };
}
export async function sendMarkdownCardFeishu(params) {
    const { client, to, text, replyToMessageId, mentions } = params;
    const receiveId = normalizeFeishuTarget(to);
    if (!receiveId)
        throw new Error(`Invalid Feishu target: ${to}`);
    const receiveIdType = resolveReceiveIdType(receiveId);
    let cardText = text;
    if (mentions && mentions.length > 0) {
        cardText = buildMentionedCardContent(mentions, text);
    }
    const card = buildMarkdownCard(cardText);
    const content = JSON.stringify(card);
    if (replyToMessageId) {
        const response = await client.im.message.reply({
            path: { message_id: replyToMessageId },
            data: { content, msg_type: "interactive" },
        });
        assertFeishuMessageApiSuccess(response, "Feishu card reply failed");
        return toFeishuSendResult(response, receiveId);
    }
    const response = await client.im.message.create({
        params: { receive_id_type: receiveIdType },
        data: { receive_id: receiveId, content, msg_type: "interactive" },
    });
    assertFeishuMessageApiSuccess(response, "Feishu card send failed");
    return toFeishuSendResult(response, receiveId);
}
export async function updateCardFeishu(params) {
    const { client, messageId, card } = params;
    const content = JSON.stringify(card);
    const response = await client.im.message.patch({
        path: { message_id: messageId },
        data: { content },
    });
    if (response.code !== 0) {
        throw new Error(`Feishu card update failed: ${response.msg || `code ${response.code}`}`);
    }
}
//# sourceMappingURL=send.js.map