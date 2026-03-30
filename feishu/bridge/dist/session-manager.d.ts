/**
 * Claude Agent SDK session manager.
 *
 * Core design:
 * - Session key computed from chat context (DM/group/topic)
 * - Sessions have a TTL (default 30min) — expired sessions start fresh
 * - Uses `query()` with `resume` to continue existing sessions
 * - `cwd` points to the project folder so Claude reads CLAUDE.md
 * - Feishu tools registered as in-process MCP server via createSdkMcpServer
 */
import type { BridgeConfig } from "./config.js";
export type SlashCommandResult = {
    handled: boolean;
    response?: string;
};
export type SessionManager = {
    handleMessage(params: {
        sessionKey: string;
        message: string;
        onText: (text: string) => void;
        onComplete: (text: string, segments: string[], toolCalls: string[], durationMs: number) => Promise<void>;
        onError: (error: unknown) => Promise<void>;
        onAbort?: () => Promise<void>;
    }): Promise<void>;
    handleSlashCommand(sessionKey: string, command: string): SlashCommandResult;
};
export declare function createSessionManager(params: {
    config: BridgeConfig;
    projectDir: string;
    log: (...args: any[]) => void;
}): SessionManager;
