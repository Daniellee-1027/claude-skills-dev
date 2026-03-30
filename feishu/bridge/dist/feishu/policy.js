/**
 * Access control policy for feishu bridge.
 * Simplified from openclaw/feishu/src/policy.ts.
 */
export function resolveAllowlistMatch(params) {
    const { allowFrom, senderId } = params;
    if (allowFrom.length === 0)
        return false;
    if (allowFrom.includes("*"))
        return true;
    return allowFrom.map((e) => e.trim().toLowerCase()).includes(senderId.trim().toLowerCase());
}
export function isGroupAllowed(params) {
    if (params.groupPolicy === "disabled")
        return false;
    if (params.groupPolicy === "open")
        return true;
    return resolveAllowlistMatch({ allowFrom: params.allowFrom, senderId: params.id });
}
export function shouldRequireMention(config, isGroup) {
    if (!isGroup)
        return false;
    return config.feishu.requireMention;
}
//# sourceMappingURL=policy.js.map