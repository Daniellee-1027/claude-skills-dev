/**
 * Access control policy for feishu bridge.
 * Simplified from openclaw/feishu/src/policy.ts.
 */

import type { BridgeConfig } from "../config.js";

export function resolveAllowlistMatch(params: {
  allowFrom: string[];
  senderId: string;
}): boolean {
  const { allowFrom, senderId } = params;
  if (allowFrom.length === 0) return false;
  if (allowFrom.includes("*")) return true;
  return allowFrom.map((e) => e.trim().toLowerCase()).includes(senderId.trim().toLowerCase());
}

export function isGroupAllowed(params: {
  groupPolicy: "open" | "allowlist" | "disabled";
  allowFrom: string[];
  id: string;
}): boolean {
  if (params.groupPolicy === "disabled") return false;
  if (params.groupPolicy === "open") return true;
  return resolveAllowlistMatch({ allowFrom: params.allowFrom, senderId: params.id });
}

export function shouldRequireMention(config: BridgeConfig, isGroup: boolean): boolean {
  if (!isGroup) return false;
  return config.feishu.requireMention;
}
