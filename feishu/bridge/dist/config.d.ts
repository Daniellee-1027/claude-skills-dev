/**
 * Configuration loading for feishu bridge daemon.
 * Reads feishu.config.json from the project directory.
 */
import { z } from "zod";
declare const FeishuToolsSchema: z.ZodObject<{
    doc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    wiki: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    bitable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    drive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    perm: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    doc: boolean;
    wiki: boolean;
    bitable: boolean;
    drive: boolean;
    perm: boolean;
}, {
    doc?: boolean | undefined;
    wiki?: boolean | undefined;
    bitable?: boolean | undefined;
    drive?: boolean | undefined;
    perm?: boolean | undefined;
}>;
declare const BridgeConfigSchema: z.ZodObject<{
    feishu: z.ZodObject<{
        appId: z.ZodString;
        appSecret: z.ZodString;
        encryptKey: z.ZodOptional<z.ZodString>;
        verificationToken: z.ZodOptional<z.ZodString>;
        domain: z.ZodDefault<z.ZodUnion<[z.ZodEnum<["feishu", "lark"]>, z.ZodString]>>;
        connectionMode: z.ZodDefault<z.ZodEnum<["websocket", "webhook"]>>;
        webhookPort: z.ZodOptional<z.ZodNumber>;
        webhookHost: z.ZodOptional<z.ZodString>;
        webhookPath: z.ZodOptional<z.ZodString>;
        requireMention: z.ZodDefault<z.ZodBoolean>;
        dmPolicy: z.ZodDefault<z.ZodEnum<["open", "allowlist"]>>;
        groupPolicy: z.ZodDefault<z.ZodEnum<["open", "allowlist", "disabled"]>>;
        allowFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tools: z.ZodOptional<z.ZodObject<{
            doc: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            wiki: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            bitable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            drive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            perm: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strict", z.ZodTypeAny, {
            doc: boolean;
            wiki: boolean;
            bitable: boolean;
            drive: boolean;
            perm: boolean;
        }, {
            doc?: boolean | undefined;
            wiki?: boolean | undefined;
            bitable?: boolean | undefined;
            drive?: boolean | undefined;
            perm?: boolean | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        appId: string;
        appSecret: string;
        domain: string;
        connectionMode: "websocket" | "webhook";
        requireMention: boolean;
        dmPolicy: "open" | "allowlist";
        groupPolicy: "open" | "allowlist" | "disabled";
        encryptKey?: string | undefined;
        verificationToken?: string | undefined;
        webhookPort?: number | undefined;
        webhookHost?: string | undefined;
        webhookPath?: string | undefined;
        allowFrom?: string[] | undefined;
        groupAllowFrom?: string[] | undefined;
        tools?: {
            doc: boolean;
            wiki: boolean;
            bitable: boolean;
            drive: boolean;
            perm: boolean;
        } | undefined;
    }, {
        appId: string;
        appSecret: string;
        encryptKey?: string | undefined;
        verificationToken?: string | undefined;
        domain?: string | undefined;
        connectionMode?: "websocket" | "webhook" | undefined;
        webhookPort?: number | undefined;
        webhookHost?: string | undefined;
        webhookPath?: string | undefined;
        requireMention?: boolean | undefined;
        dmPolicy?: "open" | "allowlist" | undefined;
        groupPolicy?: "open" | "allowlist" | "disabled" | undefined;
        allowFrom?: string[] | undefined;
        groupAllowFrom?: string[] | undefined;
        tools?: {
            doc?: boolean | undefined;
            wiki?: boolean | undefined;
            bitable?: boolean | undefined;
            drive?: boolean | undefined;
            perm?: boolean | undefined;
        } | undefined;
    }>;
    claude: z.ZodOptional<z.ZodObject<{
        model: z.ZodDefault<z.ZodString>;
        sessionTtlMs: z.ZodDefault<z.ZodNumber>;
        permissionMode: z.ZodDefault<z.ZodEnum<["default", "acceptEdits", "bypassPermissions"]>>;
        allowedTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        model: string;
        sessionTtlMs: number;
        permissionMode: "default" | "acceptEdits" | "bypassPermissions";
        allowedTools?: string[] | undefined;
    }, {
        model?: string | undefined;
        sessionTtlMs?: number | undefined;
        permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | undefined;
        allowedTools?: string[] | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    feishu: {
        appId: string;
        appSecret: string;
        domain: string;
        connectionMode: "websocket" | "webhook";
        requireMention: boolean;
        dmPolicy: "open" | "allowlist";
        groupPolicy: "open" | "allowlist" | "disabled";
        encryptKey?: string | undefined;
        verificationToken?: string | undefined;
        webhookPort?: number | undefined;
        webhookHost?: string | undefined;
        webhookPath?: string | undefined;
        allowFrom?: string[] | undefined;
        groupAllowFrom?: string[] | undefined;
        tools?: {
            doc: boolean;
            wiki: boolean;
            bitable: boolean;
            drive: boolean;
            perm: boolean;
        } | undefined;
    };
    claude?: {
        model: string;
        sessionTtlMs: number;
        permissionMode: "default" | "acceptEdits" | "bypassPermissions";
        allowedTools?: string[] | undefined;
    } | undefined;
}, {
    feishu: {
        appId: string;
        appSecret: string;
        encryptKey?: string | undefined;
        verificationToken?: string | undefined;
        domain?: string | undefined;
        connectionMode?: "websocket" | "webhook" | undefined;
        webhookPort?: number | undefined;
        webhookHost?: string | undefined;
        webhookPath?: string | undefined;
        requireMention?: boolean | undefined;
        dmPolicy?: "open" | "allowlist" | undefined;
        groupPolicy?: "open" | "allowlist" | "disabled" | undefined;
        allowFrom?: string[] | undefined;
        groupAllowFrom?: string[] | undefined;
        tools?: {
            doc?: boolean | undefined;
            wiki?: boolean | undefined;
            bitable?: boolean | undefined;
            drive?: boolean | undefined;
            perm?: boolean | undefined;
        } | undefined;
    };
    claude?: {
        model?: string | undefined;
        sessionTtlMs?: number | undefined;
        permissionMode?: "default" | "acceptEdits" | "bypassPermissions" | undefined;
        allowedTools?: string[] | undefined;
    } | undefined;
}>;
export type BridgeConfig = z.infer<typeof BridgeConfigSchema>;
export type FeishuToolsConfig = z.infer<typeof FeishuToolsSchema>;
export declare function loadConfig(configPath: string): BridgeConfig;
export {};
