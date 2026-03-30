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
import fs from "node:fs";
import path from "node:path";
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { createFeishuToolHandlers } from "./feishu-mcp-server.js";
import { createFeishuClient } from "./feishu/client.js";
/** Helper: wrap a handler to return MCP CallToolResult */
function wrapHandler(handler) {
    return async (args) => {
        try {
            const result = await handler(args);
            return { content: [{ type: "text", text: result }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: JSON.stringify({ error: err.message ?? String(err) }) }] };
        }
    };
}
/**
 * Build SDK MCP tool definitions with proper Zod schemas.
 */
function buildSdkMcpTools(toolHandlers) {
    const tools = [];
    const handlers = Object.fromEntries(toolHandlers);
    // feishu_doc
    if (handlers.feishu_doc) {
        tools.push(tool("feishu_doc", "Feishu document operations. Actions: read, write, append, create, list_blocks, get_block, update_block, delete_block", {
            action: z.enum(["read", "write", "append", "create", "list_blocks", "get_block", "update_block", "delete_block"]).describe("Operation to perform"),
            doc_token: z.string().optional().describe("Document token (extract from URL /docx/XXX)"),
            content: z.string().optional().describe("Markdown content for write/append, or new text for update_block"),
            title: z.string().optional().describe("Document title (for create)"),
            folder_token: z.string().optional().describe("Target folder token (for create)"),
            block_id: z.string().optional().describe("Block ID (for get_block, update_block, delete_block)"),
        }, wrapHandler(handlers.feishu_doc.handler)));
    }
    // feishu_wiki
    if (handlers.feishu_wiki) {
        tools.push(tool("feishu_wiki", "Feishu knowledge base operations. Actions: spaces (list all), nodes (browse), get (read node), create, move (within wiki), rename, delete, import_to_wiki (import cloud-space doc/bitable INTO wiki). No search — must browse via spaces → nodes → get.", {
            action: z.enum(["spaces", "nodes", "get", "create", "move", "rename", "delete", "import_to_wiki"]).describe("Operation to perform. Use 'import_to_wiki' to move a doc/bitable from cloud drive into wiki."),
            space_id: z.string().optional().describe("Knowledge space ID"),
            parent_node_token: z.string().optional().describe("Parent node token (for nodes/create)"),
            token: z.string().optional().describe("Wiki node token from URL /wiki/XXX (for get)"),
            title: z.string().optional().describe("Node title (for create/rename)"),
            obj_type: z.string().optional().describe("Object type: docx, sheet, bitable (for create/import_to_wiki)"),
            obj_token: z.string().optional().describe("Cloud document token to import (for import_to_wiki, e.g. bitable app_token)"),
            node_token: z.string().optional().describe("Node token (for move/rename)"),
            target_space_id: z.string().optional().describe("Target space ID (for move)"),
            target_parent_token: z.string().optional().describe("Target parent node token (for move)"),
            parent_wiki_token: z.string().optional().describe("Parent wiki node token (for import_to_wiki, optional)"),
        }, wrapHandler(handlers.feishu_wiki.handler)));
    }
    // feishu_bitable_get_meta
    if (handlers.feishu_bitable_get_meta) {
        tools.push(tool("feishu_bitable_get_meta", "Parse a Bitable URL and get app_token, table_id, and table list", { url: z.string().describe("Bitable URL (wiki or base format)") }, wrapHandler(handlers.feishu_bitable_get_meta.handler)));
    }
    // feishu_bitable_list_fields
    if (handlers.feishu_bitable_list_fields) {
        tools.push(tool("feishu_bitable_list_fields", "List all fields (columns) in a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
        }, wrapHandler(handlers.feishu_bitable_list_fields.handler)));
    }
    // feishu_bitable_list_records
    if (handlers.feishu_bitable_list_records) {
        tools.push(tool("feishu_bitable_list_records", "List records (rows) from a Bitable table with pagination", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            page_size: z.number().optional().describe("Page size (default 100, max 500)"),
            page_token: z.string().optional().describe("Page token for pagination"),
        }, wrapHandler(handlers.feishu_bitable_list_records.handler)));
    }
    // feishu_bitable_get_record
    if (handlers.feishu_bitable_get_record) {
        tools.push(tool("feishu_bitable_get_record", "Get a single record by ID from a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            record_id: z.string().describe("Record ID"),
        }, wrapHandler(handlers.feishu_bitable_get_record.handler)));
    }
    // feishu_bitable_create_record
    if (handlers.feishu_bitable_create_record) {
        tools.push(tool("feishu_bitable_create_record", "Create a new record (row) in a Bitable table. Use field names as keys in fields object.", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            fields: z.record(z.any()).describe("Field name → value mapping"),
        }, wrapHandler(handlers.feishu_bitable_create_record.handler)));
    }
    // feishu_bitable_update_record
    if (handlers.feishu_bitable_update_record) {
        tools.push(tool("feishu_bitable_update_record", "Update an existing record in a Bitable table. Only specified fields are modified.", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            record_id: z.string().describe("Record ID"),
            fields: z.record(z.any()).describe("Field name → value mapping (partial update)"),
        }, wrapHandler(handlers.feishu_bitable_update_record.handler)));
    }
    // feishu_bitable_delete_record
    if (handlers.feishu_bitable_delete_record) {
        tools.push(tool("feishu_bitable_delete_record", "Delete a record from a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            record_id: z.string().describe("Record ID"),
        }, wrapHandler(handlers.feishu_bitable_delete_record.handler)));
    }
    // feishu_bitable_create_app
    if (handlers.feishu_bitable_create_app) {
        tools.push(tool("feishu_bitable_create_app", "Create a new Bitable (multidimensional table) application", {
            name: z.string().describe("Bitable name"),
            folder_token: z.string().optional().describe("Target folder token"),
        }, wrapHandler(handlers.feishu_bitable_create_app.handler)));
    }
    // feishu_bitable_create_field
    if (handlers.feishu_bitable_create_field) {
        tools.push(tool("feishu_bitable_create_field", "Create a new field (column) in a Bitable table. field_type: 1=Text, 2=Number, 3=SingleSelect, 4=MultiSelect, 5=DateTime, 7=Checkbox, 15=URL", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            field_name: z.string().describe("Field name"),
            field_type: z.number().describe("Field type number (1=Text, 2=Number, 3=SingleSelect, etc.)"),
            property: z.record(z.any()).optional().describe("Field property config (e.g. options for select fields)"),
        }, wrapHandler(handlers.feishu_bitable_create_field.handler)));
    }
    // feishu_bitable_import_csv
    if (handlers.feishu_bitable_import_csv) {
        tools.push(tool("feishu_bitable_import_csv", "Import a local CSV file into a new Feishu Bitable. Auto-infers field types, creates table, batch imports all rows. Optionally moves to wiki space.", {
            csv_path: z.string().describe("Absolute path to the CSV file"),
            table_name: z.string().describe("Name for the new Bitable"),
            field_overrides: z.record(z.object({
                name: z.string().optional(),
                type: z.number().optional(),
            })).optional().describe("Override inferred field name/type: {csv_col: {name: '中文名', type: 4}}"),
            wiki_space_id: z.string().optional().describe("Wiki space ID to move the bitable into after creation"),
            wiki_parent_node_token: z.string().optional().describe("Parent node token in wiki to place the bitable under (e.g. Hermes page)"),
        }, wrapHandler(handlers.feishu_bitable_import_csv.handler)));
    }
    // feishu_bitable_batch_create_records
    if (handlers.feishu_bitable_batch_create_records) {
        tools.push(tool("feishu_bitable_batch_create_records", "Batch create records (rows) in a Bitable table. Max 500 per call. Each item in records is a {field_name: value} object.", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            records: z.array(z.record(z.any())).describe("Array of field objects [{field_name: value, ...}, ...]"),
        }, wrapHandler(handlers.feishu_bitable_batch_create_records.handler)));
    }
    // feishu_bitable_batch_delete_records
    if (handlers.feishu_bitable_batch_delete_records) {
        tools.push(tool("feishu_bitable_batch_delete_records", "Batch delete records from a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            record_ids: z.array(z.string()).describe("Array of record IDs to delete"),
        }, wrapHandler(handlers.feishu_bitable_batch_delete_records.handler)));
    }
    // feishu_bitable_rename_field
    if (handlers.feishu_bitable_rename_field) {
        tools.push(tool("feishu_bitable_rename_field", "Rename a field (column) in a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            field_id: z.string().describe("Field ID"),
            field_name: z.string().describe("New field name"),
        }, wrapHandler(handlers.feishu_bitable_rename_field.handler)));
    }
    // feishu_bitable_delete_field
    if (handlers.feishu_bitable_delete_field) {
        tools.push(tool("feishu_bitable_delete_field", "Delete a field (column) from a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            field_id: z.string().describe("Field ID"),
        }, wrapHandler(handlers.feishu_bitable_delete_field.handler)));
    }
    // feishu_bitable_create_view
    if (handlers.feishu_bitable_create_view) {
        tools.push(tool("feishu_bitable_create_view", "Create a view in a Bitable table", {
            app_token: z.string().describe("Bitable app token"),
            table_id: z.string().describe("Table ID"),
            view_name: z.string().describe("View name"),
            view_type: z.string().optional().describe("View type: grid, kanban, gallery, gantt, form (default: grid)"),
        }, wrapHandler(handlers.feishu_bitable_create_view.handler)));
    }
    // feishu_drive
    if (handlers.feishu_drive) {
        tools.push(tool("feishu_drive", "Feishu cloud storage operations. Actions: list, info, create_folder, move, delete", {
            action: z.enum(["list", "info", "create_folder", "move", "delete"]).describe("Operation to perform"),
            folder_token: z.string().optional().describe("Folder token (omit for root)"),
            file_token: z.string().optional().describe("File token (for info/move/delete)"),
            type: z.string().optional().describe("File type: doc, docx, sheet, bitable, folder, file, mindnote, shortcut"),
            name: z.string().optional().describe("Folder name (for create_folder)"),
        }, wrapHandler(handlers.feishu_drive.handler)));
    }
    // feishu_perm
    if (handlers.feishu_perm) {
        tools.push(tool("feishu_perm", "Feishu permission management. Actions: list, add, remove", {
            action: z.enum(["list", "add", "remove"]).describe("Operation to perform"),
            token: z.string().describe("File/folder token"),
            type: z.string().describe("Resource type: file, folder, docx, etc."),
            member_type: z.string().optional().describe("Member type: user, department, group"),
            member_id: z.string().optional().describe("Member ID"),
            perm: z.string().optional().describe("Permission level: view, edit, manage"),
        }, wrapHandler(handlers.feishu_perm.handler)));
    }
    return tools;
}
export function createSessionManager(params) {
    const { config, projectDir, log } = params;
    const ttlMs = config.claude?.sessionTtlMs ?? 1800000; // 30min default
    // --- Session persistence ---
    const sessionFile = path.join(projectDir, ".session-cache.json");
    function loadSessions() {
        try {
            const data = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
            const map = new Map();
            for (const [key, val] of Object.entries(data)) {
                const v = val;
                map.set(key, { sessionId: v.sessionId, lastActiveAt: v.lastActiveAt, modelOverride: v.modelOverride });
            }
            log(`session: loaded ${map.size} sessions from disk`);
            return map;
        }
        catch {
            return new Map();
        }
    }
    function saveSessions() {
        const obj = {};
        for (const [key, entry] of sessions) {
            if (entry.sessionId) {
                obj[key] = { sessionId: entry.sessionId, lastActiveAt: entry.lastActiveAt, modelOverride: entry.modelOverride };
            }
        }
        try {
            fs.writeFileSync(sessionFile, JSON.stringify(obj, null, 2));
        }
        catch (err) {
            log(`session: failed to save sessions:`, err);
        }
    }
    const sessions = loadSessions();
    // Build MCP tool handlers for feishu tools
    const client = createFeishuClient(config.feishu);
    const toolHandlers = createFeishuToolHandlers({
        client,
        toolsConfig: config.feishu.tools,
    });
    // Create in-process MCP server with proper Zod schemas
    const feishuMcpServer = createSdkMcpServer({
        name: "feishu",
        version: "1.0.0",
        tools: buildSdkMcpTools(toolHandlers),
    });
    // Tool names for auto-allow (bypass permission prompts)
    const feishuToolNames = Array.from(toolHandlers.keys()).map((name) => `mcp__feishu__${name}`);
    return {
        handleSlashCommand(sessionKey, command) {
            const trimmed = command.trim();
            const [cmd, ...args] = trimmed.split(/\s+/);
            const lowerCmd = cmd.toLowerCase();
            switch (lowerCmd) {
                case "/stop":
                case "/cancel":
                case "/abort": {
                    const entry = sessions.get(sessionKey);
                    if (entry?.abortController) {
                        entry.abortController.abort();
                        return { handled: true, response: "⚡ 已中断当前任务。" };
                    }
                    return { handled: true, response: "没有正在运行的任务。" };
                }
                case "/status": {
                    const entry = sessions.get(sessionKey);
                    if (!entry || !entry.sessionId) {
                        return { handled: true, response: "📋 当前没有活跃的 session。" };
                    }
                    const age = Date.now() - entry.lastActiveAt;
                    const ageMin = Math.floor(age / 60000);
                    const isRunning = !!entry.abortController;
                    const isExpired = age > ttlMs;
                    const model = entry.modelOverride ?? config.claude?.model ?? "claude-sonnet-4-20250514";
                    let status = `📋 **Session 状态**\n`;
                    status += `- Session ID: \`${entry.sessionId.slice(0, 8)}...\`\n`;
                    status += `- 模型: \`${model}\`\n`;
                    status += `- 上次活跃: ${ageMin} 分钟前\n`;
                    status += `- 状态: ${isRunning ? "🔄 运行中" : isExpired ? "⏰ 已过期" : "💤 空闲"}`;
                    return { handled: true, response: status };
                }
                case "/reset":
                case "/new": {
                    const entry = sessions.get(sessionKey);
                    if (entry?.abortController) {
                        entry.abortController.abort();
                    }
                    sessions.delete(sessionKey);
                    saveSessions();
                    return { handled: true, response: "🔄 Session 已重置，下次对话将开始新的会话。" };
                }
                case "/model": {
                    const MODEL_ALIASES = {
                        sonnet: "claude-sonnet-4-6",
                        opus: "claude-opus-4-6",
                        haiku: "claude-haiku-4-5-20251001",
                    };
                    const defaultModel = config.claude?.model ?? "claude-sonnet-4-20250514";
                    const entry = sessions.get(sessionKey);
                    const currentModel = entry?.modelOverride ?? defaultModel;
                    if (args.length === 0) {
                        // Show current model
                        const aliases = Object.entries(MODEL_ALIASES).map(([alias, id]) => id === currentModel ? `**${alias}** ✅` : alias).join(" / ");
                        return { handled: true, response: `🤖 当前模型: \`${currentModel}\`\n可选: ${aliases}` };
                    }
                    const requested = args[0].toLowerCase();
                    const modelId = MODEL_ALIASES[requested] ?? requested;
                    if (entry) {
                        entry.modelOverride = modelId;
                    }
                    else {
                        sessions.set(sessionKey, { sessionId: "", lastActiveAt: Date.now(), modelOverride: modelId });
                    }
                    saveSessions();
                    return { handled: true, response: `🤖 模型已切换为 \`${modelId}\`` };
                }
                case "/memory": {
                    const memoryPath = path.join(projectDir, "memory", "learnings.md");
                    try {
                        const content = fs.readFileSync(memoryPath, "utf-8").trim();
                        if (!content || content === "# Bot 经验记录") {
                            return { handled: true, response: "📝 还没有记录任何经验。" };
                        }
                        return { handled: true, response: content };
                    }
                    catch {
                        return { handled: true, response: "📝 记忆文件不存在。" };
                    }
                }
                case "/context": {
                    const ctxPath = path.join(projectDir, "docs", "bot-context.md");
                    try {
                        const content = fs.readFileSync(ctxPath, "utf-8").trim();
                        return { handled: true, response: content };
                    }
                    catch {
                        return { handled: true, response: "⚙️ 上下文文件不存在。运行 `/feishu init-context` 初始化。" };
                    }
                }
                case "/logs": {
                    const logsDir = path.join(projectDir, "logs");
                    try {
                        if (!fs.existsSync(logsDir)) {
                            return { handled: true, response: "📄 没有对话日志。" };
                        }
                        const files = fs.readdirSync(logsDir)
                            .filter(f => f.endsWith(".md"))
                            .sort()
                            .reverse()
                            .slice(0, 5);
                        if (files.length === 0) {
                            return { handled: true, response: "📄 没有对话日志。" };
                        }
                        // Show most recent log
                        const latest = files[0];
                        const content = fs.readFileSync(path.join(logsDir, latest), "utf-8").trim();
                        let response = `📄 **最近日志** (${latest})\n\n${content}`;
                        if (files.length > 1) {
                            response += `\n\n其他日志: ${files.slice(1).join(", ")}`;
                        }
                        return { handled: true, response };
                    }
                    catch {
                        return { handled: true, response: "📄 读取日志失败。" };
                    }
                }
                case "/compact": {
                    // Reset session — next message starts fresh
                    const entry = sessions.get(sessionKey);
                    if (entry?.abortController) {
                        entry.abortController.abort();
                    }
                    sessions.delete(sessionKey);
                    saveSessions();
                    return { handled: true, response: "🗜️ 上下文已压缩（session 已重置），下条消息开始新对话。" };
                }
                case "/help": {
                    const help = `**可用命令：**
- \`/stop\` — 中断当前正在执行的任务
- \`/status\` — 查看当前 session 状态
- \`/reset\` — 重置 session，开始新对话
- \`/compact\` — 压缩上下文（重置 session）
- \`/model [name]\` — 查看/切换模型（sonnet / opus / haiku）
- \`/memory\` — 查看 bot 经验记录
- \`/context\` — 查看 bot 上下文配置
- \`/logs\` — 查看最近对话日志
- \`/help\` — 显示此帮助信息`;
                    return { handled: true, response: help };
                }
                default:
                    return { handled: false };
            }
        },
        async handleMessage({ sessionKey, message, onText, onComplete, onError, onAbort }) {
            const now = Date.now();
            const existing = sessions.get(sessionKey);
            let resumeSessionId;
            const previousSessionId = existing?.sessionId;
            // Abort any running query for this session
            if (existing?.abortController) {
                log(`session: aborting running query for ${sessionKey}`);
                existing.abortController.abort();
            }
            if (existing && now - existing.lastActiveAt < ttlMs && existing.sessionId) {
                resumeSessionId = existing.sessionId;
                log(`session: resuming ${sessionKey} (session=${resumeSessionId})`);
            }
            else {
                if (existing) {
                    log(`session: expired ${sessionKey}, starting new`);
                }
                else {
                    log(`session: new ${sessionKey}`);
                }
            }
            // Create abort controller for this query
            const abortController = new AbortController();
            try {
                let fullText = "";
                let sessionId;
                const segments = [];
                const toolCalls = [];
                const startTime = Date.now();
                let lastMsgType = "";
                const sessionEntry = sessions.get(sessionKey);
                const claudeModel = sessionEntry?.modelOverride ?? config.claude?.model ?? "claude-sonnet-4-20250514";
                const permissionMode = config.claude?.permissionMode ?? "bypassPermissions";
                // Build allowed tools list
                const baseTools = ["Read", "Write", "Edit", "Grep", "Glob", "Bash"];
                const allowedTools = [...baseTools, ...feishuToolNames];
                // Store abort controller so next message can abort this query
                // Preserve previous sessionId so it's not lost if this query gets aborted
                if (existing) {
                    existing.abortController = abortController;
                    existing.lastActiveAt = now;
                }
                else {
                    sessions.set(sessionKey, { sessionId: previousSessionId ?? "", lastActiveAt: now, abortController });
                }
                const queryOptions = {
                    cwd: projectDir,
                    model: claudeModel,
                    permissionMode,
                    allowedTools,
                    // Register feishu MCP server so tools are actually callable
                    mcpServers: {
                        feishu: feishuMcpServer,
                    },
                    // Load project settings so CLAUDE.md is read as system instructions
                    settingSources: ["project"],
                    abortSignal: abortController.signal,
                    ...(resumeSessionId && { resume: resumeSessionId }),
                };
                for await (const msg of query({ prompt: message, options: queryOptions })) {
                    // Check if aborted by a newer message
                    if (abortController.signal.aborted) {
                        log(`session: query aborted for ${sessionKey}`);
                        break;
                    }
                    log(`session: msg.type=${msg.type}`);
                    if (msg.type === "assistant" && msg.message?.content) {
                        // New segment when assistant follows non-assistant
                        if (lastMsgType !== "assistant") {
                            segments.push("");
                            log(`session: new segment #${segments.length} (prev type was "${lastMsgType}")`);
                        }
                        for (const block of msg.message.content) {
                            if ("text" in block && block.text) {
                                fullText += block.text;
                                segments[segments.length - 1] += block.text;
                                onText(fullText);
                            }
                            if (block.type === "tool_use" && block.name) {
                                toolCalls.push(block.name);
                            }
                        }
                        lastMsgType = "assistant";
                    }
                    else if (msg.type === "result") {
                        sessionId = msg.session_id;
                        lastMsgType = msg.type;
                    }
                    else {
                        // Only update lastMsgType for non-streaming events
                        // stream_event / tool_progress should NOT break assistant continuity
                        if (msg.type !== "stream_event" && msg.type !== "tool_progress") {
                            lastMsgType = msg.type;
                        }
                    }
                }
                const durationMs = Date.now() - startTime;
                log(`session: complete. segments=${segments.length}, lengths=[${segments.map(s => s.length).join(",")}], toolCalls=[${toolCalls.join(",")}], duration=${durationMs}ms`);
                // Clear abort controller and update session
                const effectiveSessionId = sessionId || previousSessionId || "";
                if (effectiveSessionId) {
                    const entry = sessions.get(sessionKey);
                    sessions.set(sessionKey, { sessionId: effectiveSessionId, lastActiveAt: Date.now(), modelOverride: entry?.modelOverride });
                }
                else {
                    // No session ID at all — just clear the abort controller
                    const entry = sessions.get(sessionKey);
                    if (entry)
                        entry.abortController = undefined;
                }
                saveSessions();
                // Handle abort: close streaming card gracefully
                if (abortController.signal.aborted) {
                    if (onAbort)
                        await onAbort();
                    return;
                }
                // Send final text
                if (fullText.trim()) {
                    await onComplete(fullText, segments, toolCalls, durationMs);
                }
            }
            catch (err) {
                // Don't report abort as error — it's intentional interruption
                if (abortController.signal.aborted) {
                    log(`session: query aborted (caught) for ${sessionKey}`);
                    return;
                }
                await onError(err);
            }
        },
    };
}
//# sourceMappingURL=session-manager.js.map