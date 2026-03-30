/**
 * In-process MCP server wrapping Feishu tools.
 * Exposes feishu_doc, feishu_wiki, feishu_bitable, feishu_drive, feishu_perm
 * as MCP tools for Claude Agent SDK.
 */
import type { Client } from "@larksuiteoapi/node-sdk";
import type { FeishuToolsConfig } from "./config.js";
type ToolHandler = (params: any) => Promise<string>;
export declare function createFeishuToolHandlers(params: {
    client: Client;
    toolsConfig?: FeishuToolsConfig;
}): Map<string, {
    handler: ToolHandler;
    description: string;
    inputSchema: any;
}>;
export {};
