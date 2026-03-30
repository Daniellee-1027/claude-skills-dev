/**
 * Feishu API response helpers.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/send-result.ts.
 */
export function assertFeishuMessageApiSuccess(response, errorPrefix) {
    if (response.code !== 0) {
        throw new Error(`${errorPrefix}: ${response.msg || `code ${response.code}`}`);
    }
}
export function toFeishuSendResult(response, chatId) {
    return {
        messageId: response.data?.message_id ?? "unknown",
        chatId,
    };
}
//# sourceMappingURL=send-result.js.map