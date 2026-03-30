/**
 * Configuration loading for feishu bridge daemon.
 * Reads feishu.config.json from the project directory.
 */

import fs from "node:fs";
import { z } from "zod";

const FeishuToolsSchema = z
  .object({
    doc: z.boolean().optional().default(true),
    wiki: z.boolean().optional().default(true),
    bitable: z.boolean().optional().default(true),
    drive: z.boolean().optional().default(true),
    perm: z.boolean().optional().default(false),
  })
  .strict();

const FeishuSchema = z
  .object({
    appId: z.string().min(1),
    appSecret: z.string().min(1),
    encryptKey: z.string().optional(),
    verificationToken: z.string().optional(),
    domain: z.union([z.enum(["feishu", "lark"]), z.string().url()]).default("feishu"),
    connectionMode: z.enum(["websocket", "webhook"]).default("websocket"),
    webhookPort: z.number().int().positive().optional(),
    webhookHost: z.string().optional(),
    webhookPath: z.string().optional(),
    requireMention: z.boolean().default(true),
    dmPolicy: z.enum(["open", "allowlist"]).default("open"),
    groupPolicy: z.enum(["open", "allowlist", "disabled"]).default("open"),
    allowFrom: z.array(z.string()).optional(),
    groupAllowFrom: z.array(z.string()).optional(),
    tools: FeishuToolsSchema.optional(),
  })
  .strict();

const ClaudeSchema = z
  .object({
    model: z.string().default("claude-sonnet-4-20250514"),
    sessionTtlMs: z.number().int().positive().default(1800000), // 30min
    permissionMode: z
      .enum(["default", "acceptEdits", "bypassPermissions"])
      .default("bypassPermissions"),
    allowedTools: z.array(z.string()).optional(),
  })
  .strict();

const BridgeConfigSchema = z
  .object({
    feishu: FeishuSchema,
    claude: ClaudeSchema.optional(),
  })
  .strict();

export type BridgeConfig = z.infer<typeof BridgeConfigSchema>;
export type FeishuToolsConfig = z.infer<typeof FeishuToolsSchema>;

export function loadConfig(configPath: string): BridgeConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return BridgeConfigSchema.parse(raw);
}
