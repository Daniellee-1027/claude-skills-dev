/**
 * In-process MCP server wrapping Feishu tools.
 * Exposes feishu_doc, feishu_wiki, feishu_bitable, feishu_drive, feishu_perm
 * as MCP tools for Claude Agent SDK.
 */
// Tool implementations
import * as docTools from "./feishu/tools/docx.js";
import * as wikiTools from "./feishu/tools/wiki.js";
import * as bitableTools from "./feishu/tools/bitable.js";
import { importCSVToBitable } from "./feishu/tools/bitable-import.js";
import * as driveTools from "./feishu/tools/drive.js";
import * as permTools from "./feishu/tools/perm.js";
// Schemas
import { FeishuDocSchema } from "./feishu/tools/schemas/doc-schema.js";
import { FeishuWikiSchema } from "./feishu/tools/schemas/wiki-schema.js";
import { FeishuDriveSchema } from "./feishu/tools/schemas/drive-schema.js";
import { FeishuPermSchema } from "./feishu/tools/schemas/perm-schema.js";
function json(data) {
    return JSON.stringify(data, null, 2);
}
export function createFeishuToolHandlers(params) {
    const { client, toolsConfig } = params;
    const tools = new Map();
    // feishu_doc
    if (toolsConfig?.doc !== false) {
        tools.set("feishu_doc", {
            description: "Feishu document operations. Actions: read, write, append, create, list_blocks, get_block, update_block, delete_block",
            inputSchema: FeishuDocSchema,
            handler: async (p) => {
                try {
                    switch (p.action) {
                        case "read": return json(await docTools.readDoc(client, p.doc_token));
                        case "write": return json(await docTools.writeDoc(client, p.doc_token, p.content));
                        case "append": return json(await docTools.appendDoc(client, p.doc_token, p.content));
                        case "create": return json(await docTools.createDoc(client, p.title, p.folder_token));
                        case "list_blocks": return json(await docTools.listBlocks(client, p.doc_token));
                        case "get_block": return json(await docTools.getBlock(client, p.doc_token, p.block_id));
                        case "update_block": return json(await docTools.updateBlock(client, p.doc_token, p.block_id, p.content));
                        case "delete_block": return json(await docTools.deleteBlock(client, p.doc_token, p.block_id));
                        default: return json({ error: `Unknown action: ${p.action}` });
                    }
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
    }
    // feishu_wiki
    if (toolsConfig?.wiki !== false) {
        tools.set("feishu_wiki", {
            description: "Feishu knowledge base operations. Actions: spaces, nodes, get, create, move, rename, import_to_wiki (import a cloud-space doc/bitable into wiki, use this when moving docs FROM drive TO wiki, requires obj_token + obj_type + space_id, optional parent_wiki_token)",
            inputSchema: FeishuWikiSchema,
            handler: async (p) => {
                try {
                    switch (p.action) {
                        case "spaces": return json(await wikiTools.listSpaces(client));
                        case "nodes": return json(await wikiTools.listNodes(client, p.space_id, p.parent_node_token));
                        case "get": return json(await wikiTools.getNode(client, p.token));
                        case "search": return json({ error: "Search is not available. Use action: 'nodes' to browse or action: 'get' to lookup by token." });
                        case "create": return json(await wikiTools.createNode(client, p.space_id, p.title, p.obj_type, p.parent_node_token));
                        case "move": return json(await wikiTools.moveNode(client, p.space_id, p.node_token, p.target_space_id, p.target_parent_token));
                        case "rename": return json(await wikiTools.renameNode(client, p.space_id, p.node_token, p.title));
                        case "import_to_wiki": return json(await wikiTools.moveDocsToWiki(client, p.space_id, p.obj_token, p.obj_type, p.parent_wiki_token));
                        case "delete": return json({ error: "飞书 wiki API 不支持通过 API 删除节点，请在飞书界面手动删除。" });
                        default: return json({ error: `Unknown action: ${p.action}` });
                    }
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
    }
    // feishu_bitable (multiple tools)
    if (toolsConfig?.bitable !== false) {
        tools.set("feishu_bitable_get_meta", {
            description: "Parse a Bitable URL and get app_token, table_id, and table list",
            inputSchema: { type: "object", properties: { url: { type: "string", description: "Bitable URL" } }, required: ["url"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.getBitableMeta(client, p.url));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_list_fields", {
            description: "List all fields (columns) in a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" } }, required: ["app_token", "table_id"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.listFields(client, p.app_token, p.table_id));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_list_records", {
            description: "List records (rows) from a Bitable table with pagination",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, page_size: { type: "number" }, page_token: { type: "string" } }, required: ["app_token", "table_id"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.listRecords(client, p.app_token, p.table_id, p.page_size, p.page_token));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_get_record", {
            description: "Get a single record by ID from a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, record_id: { type: "string" } }, required: ["app_token", "table_id", "record_id"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.getRecord(client, p.app_token, p.table_id, p.record_id));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_create_record", {
            description: "Create a new record (row) in a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, fields: { type: "object" } }, required: ["app_token", "table_id", "fields"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.createRecord(client, p.app_token, p.table_id, p.fields));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_update_record", {
            description: "Update an existing record in a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, record_id: { type: "string" }, fields: { type: "object" } }, required: ["app_token", "table_id", "record_id", "fields"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.updateRecord(client, p.app_token, p.table_id, p.record_id, p.fields));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_delete_record", {
            description: "Delete a record from a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, record_id: { type: "string" } }, required: ["app_token", "table_id", "record_id"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.deleteRecord(client, p.app_token, p.table_id, p.record_id));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_create_app", {
            description: "Create a new Bitable (multidimensional table) application",
            inputSchema: { type: "object", properties: { name: { type: "string" }, folder_token: { type: "string" } }, required: ["name"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.createApp(client, p.name, p.folder_token));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_create_field", {
            description: "Create a new field (column) in a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, field_name: { type: "string" }, field_type: { type: "number" }, property: { type: "object" } }, required: ["app_token", "table_id", "field_name", "field_type"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.createField(client, p.app_token, p.table_id, p.field_name, p.field_type, p.property));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_import_csv", {
            description: "Import a local CSV file into a new Feishu Bitable. Automatically infers field types (Text/Number/URL/MultiSelect/etc), creates the table, and batch imports all rows. Optionally moves to wiki space. Returns the bitable URL.",
            inputSchema: {
                type: "object",
                properties: {
                    csv_path: { type: "string", description: "Absolute path to the CSV file" },
                    table_name: { type: "string", description: "Name for the new Bitable" },
                    field_overrides: { type: "object", description: "Optional: {csv_column: {name: 'Chinese Name', type: 4}} to override inferred name/type" },
                    wiki_space_id: { type: "string", description: "Optional: wiki space ID to move the bitable into after creation" },
                    wiki_parent_node_token: { type: "string", description: "Optional: parent node token in wiki to place the bitable under" },
                },
                required: ["csv_path", "table_name"],
            },
            handler: async (p) => {
                try {
                    return json(await importCSVToBitable(client, p.csv_path, p.table_name, p.field_overrides, p.wiki_space_id, p.wiki_parent_node_token));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_batch_create_records", {
            description: "Batch create records (rows) in a Bitable table. Max 500 per call. Each item in records is a {field_name: value} object.",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, records: { type: "array", items: { type: "object" }, description: "Array of field objects [{field_name: value, ...}, ...]" } }, required: ["app_token", "table_id", "records"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.batchCreateRecords(client, p.app_token, p.table_id, p.records));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_batch_delete_records", {
            description: "Batch delete records from a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, record_ids: { type: "array", items: { type: "string" } } }, required: ["app_token", "table_id", "record_ids"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.batchDeleteRecords(client, p.app_token, p.table_id, p.record_ids));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_rename_field", {
            description: "Rename a field (column) in a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, field_id: { type: "string" }, field_name: { type: "string" } }, required: ["app_token", "table_id", "field_id", "field_name"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.renameField(client, p.app_token, p.table_id, p.field_id, p.field_name));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_delete_field", {
            description: "Delete a field (column) from a Bitable table",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, field_id: { type: "string" } }, required: ["app_token", "table_id", "field_id"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.deleteField(client, p.app_token, p.table_id, p.field_id));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
        tools.set("feishu_bitable_create_view", {
            description: "Create a view in a Bitable table (grid, kanban, etc.)",
            inputSchema: { type: "object", properties: { app_token: { type: "string" }, table_id: { type: "string" }, view_name: { type: "string" }, view_type: { type: "string", description: "grid, kanban, gallery, gantt, form (default: grid)" } }, required: ["app_token", "table_id", "view_name"] },
            handler: async (p) => {
                try {
                    return json(await bitableTools.createView(client, p.app_token, p.table_id, p.view_name, p.view_type));
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
    }
    // feishu_drive
    if (toolsConfig?.drive !== false) {
        tools.set("feishu_drive", {
            description: "Feishu cloud storage operations. Actions: list, info, create_folder, move, delete",
            inputSchema: FeishuDriveSchema,
            handler: async (p) => {
                try {
                    switch (p.action) {
                        case "list": return json(await driveTools.listFolder(client, p.folder_token));
                        case "info": return json(await driveTools.getFileInfo(client, p.file_token, p.folder_token));
                        case "create_folder": return json(await driveTools.createFolder(client, p.name, p.folder_token));
                        case "move": return json(await driveTools.moveFile(client, p.file_token, p.type, p.folder_token));
                        case "delete": return json(await driveTools.deleteFile(client, p.file_token, p.type));
                        default: return json({ error: `Unknown action: ${p.action}` });
                    }
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
    }
    // feishu_perm
    if (toolsConfig?.perm === true) {
        tools.set("feishu_perm", {
            description: "Feishu permission management. Actions: list, add, remove",
            inputSchema: FeishuPermSchema,
            handler: async (p) => {
                try {
                    switch (p.action) {
                        case "list": return json(await permTools.listMembers(client, p.token, p.type));
                        case "add": return json(await permTools.addMember(client, p.token, p.type, p.member_type, p.member_id, p.perm));
                        case "remove": return json(await permTools.removeMember(client, p.token, p.type, p.member_type, p.member_id));
                        default: return json({ error: `Unknown action: ${p.action}` });
                    }
                }
                catch (err) {
                    return json({ error: err.message ?? String(err) });
                }
            },
        });
    }
    return tools;
}
//# sourceMappingURL=feishu-mcp-server.js.map