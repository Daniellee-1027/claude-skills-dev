/**
 * Feishu API response helpers.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/send-result.ts.
 */
export type FeishuMessageApiResponse = {
    code?: number;
    msg?: string;
    data?: {
        message_id?: string;
    };
};
export declare function assertFeishuMessageApiSuccess(response: FeishuMessageApiResponse, errorPrefix: string): void;
export declare function toFeishuSendResult(response: FeishuMessageApiResponse, chatId: string): {
    messageId: string;
    chatId: string;
};
