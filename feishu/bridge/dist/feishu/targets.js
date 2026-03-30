/**
 * Feishu ID type detection and normalization.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/targets.ts.
 */
const CHAT_ID_PREFIX = "oc_";
const OPEN_ID_PREFIX = "ou_";
export function resolveReceiveIdType(id) {
    const trimmed = id.trim();
    if (trimmed.startsWith(CHAT_ID_PREFIX))
        return "chat_id";
    if (trimmed.startsWith(OPEN_ID_PREFIX))
        return "open_id";
    return "user_id";
}
export function normalizeFeishuTarget(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    const lowered = trimmed.toLowerCase();
    if (lowered.startsWith("chat:"))
        return trimmed.slice("chat:".length).trim() || null;
    if (lowered.startsWith("user:"))
        return trimmed.slice("user:".length).trim() || null;
    if (lowered.startsWith("open_id:"))
        return trimmed.slice("open_id:".length).trim() || null;
    return trimmed;
}
//# sourceMappingURL=targets.js.map