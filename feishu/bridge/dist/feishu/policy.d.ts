/**
 * Access control policy for feishu bridge.
 * Simplified from openclaw/feishu/src/policy.ts.
 */
import type { BridgeConfig } from "../config.js";
export declare function resolveAllowlistMatch(params: {
    allowFrom: string[];
    senderId: string;
}): boolean;
export declare function isGroupAllowed(params: {
    groupPolicy: "open" | "allowlist" | "disabled";
    allowFrom: string[];
    id: string;
}): boolean;
export declare function shouldRequireMention(config: BridgeConfig, isGroup: boolean): boolean;
