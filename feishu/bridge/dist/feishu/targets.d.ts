/**
 * Feishu ID type detection and normalization.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/targets.ts.
 */
export type FeishuIdType = "open_id" | "user_id" | "union_id" | "chat_id";
export declare function resolveReceiveIdType(id: string): "chat_id" | "open_id" | "user_id";
export declare function normalizeFeishuTarget(raw: string): string | null;
