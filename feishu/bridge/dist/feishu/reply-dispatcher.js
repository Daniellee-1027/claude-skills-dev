/**
 * Reply dispatcher for feishu bridge.
 * Simplified from openclaw/feishu/src/reply-dispatcher.ts.
 * Uses streaming cards for real-time output, falls back to text messages.
 */
import { buildMentionedMessage } from "./mention.js";
import { sendMessageFeishu } from "./send.js";
import { FeishuStreamingSession } from "./streaming-card.js";
import { resolveReceiveIdType } from "./targets.js";
const TEXT_CHUNK_LIMIT = 4000;
/** Split text into chunks */
function chunkText(text, limit) {
    if (text.length <= limit)
        return [text];
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= limit) {
            chunks.push(remaining);
            break;
        }
        // Try to break at newline
        let breakAt = remaining.lastIndexOf("\n", limit);
        if (breakAt <= 0)
            breakAt = limit;
        chunks.push(remaining.slice(0, breakAt));
        remaining = remaining.slice(breakAt).trimStart();
    }
    return chunks;
}
export function createBridgeReplyDispatcher(params) {
    const { client, config, chatId, replyToMessageId, mentionTargets, log } = params;
    const creds = config.feishu.appId && config.feishu.appSecret
        ? { appId: config.feishu.appId, appSecret: config.feishu.appSecret, domain: config.feishu.domain }
        : null;
    let streaming = null;
    let streamingStarted = false;
    let streamingStartPromise = null;
    let lastPartialText = "";
    const startStreaming = () => {
        if (streamingStarted || !creds)
            return;
        streamingStarted = true;
        streamingStartPromise = (async () => {
            streaming = new FeishuStreamingSession(client, creds, (msg) => log(`feishu: streaming: ${msg}`));
            try {
                await streaming.start(chatId, resolveReceiveIdType(chatId));
            }
            catch (err) {
                log(`feishu: streaming start failed: ${String(err)}`);
                streaming = null;
            }
        })();
    };
    return {
        onPartialText(text) {
            if (text === lastPartialText)
                return;
            lastPartialText = text;
            // Start streaming on first text
            if (!streamingStarted)
                startStreaming();
            // Update streaming card
            if (streamingStartPromise) {
                streamingStartPromise.then(() => {
                    if (streaming?.isActive()) {
                        streaming.update(text);
                    }
                });
            }
        },
        async onComplete(text, segments, toolCalls, durationMs) {
            // Wait for streaming to be ready
            if (streamingStartPromise)
                await streamingStartPromise;
            // Delete streaming card (it was just a thinking indicator), send answer as post message
            if (streaming) {
                if (streaming.isActive()) {
                    await streaming.deleteMessage();
                }
                const answer = (segments.length > 1 && segments[segments.length - 1]?.trim())
                    ? segments[segments.length - 1]
                    : text;
                // Send the answer as regular post message(s), no tool summary footer
                if (answer.trim()) {
                    let finalAnswer = answer;
                    if (mentionTargets?.length) {
                        finalAnswer = buildMentionedMessage(mentionTargets, finalAnswer);
                    }
                    const chunks = chunkText(finalAnswer, TEXT_CHUNK_LIMIT);
                    for (const chunk of chunks) {
                        await sendMessageFeishu({ client, to: chatId, text: chunk });
                    }
                }
                return;
            }
            // Fallback: send as regular message(s)
            if (!text.trim())
                return;
            const chunks = chunkText(text, TEXT_CHUNK_LIMIT);
            let first = true;
            for (const chunk of chunks) {
                let msgText = chunk;
                if (first && mentionTargets?.length) {
                    msgText = buildMentionedMessage(mentionTargets, msgText);
                }
                await sendMessageFeishu({
                    client,
                    to: chatId,
                    text: msgText,
                    replyToMessageId: first ? replyToMessageId : undefined,
                });
                first = false;
            }
        },
        async onError(error) {
            // Delete streaming card if active
            if (streamingStartPromise)
                await streamingStartPromise;
            if (streaming?.isActive()) {
                await streaming.deleteMessage();
            }
            // Send error as regular message
            try {
                await sendMessageFeishu({
                    client,
                    to: chatId,
                    text: `❌ Error: ${String(error)}`,
                    replyToMessageId,
                });
            }
            catch (err) {
                log(`feishu: failed to send error message: ${String(err)}`);
            }
        },
        async onAbort() {
            // Delete streaming card when query is interrupted
            if (streamingStartPromise)
                await streamingStartPromise;
            if (streaming?.isActive()) {
                await streaming.deleteMessage();
            }
        },
    };
}
//# sourceMappingURL=reply-dispatcher.js.map