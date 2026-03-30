/**
 * High-level bitable import: CSV file → Feishu Bitable, one tool call.
 * Handles: create table, infer field types, clean defaults, setup fields, batch import.
 */
import type * as Lark from "@larksuiteoapi/node-sdk";
export declare function importCSVToBitable(client: Lark.Client, csvPath: string, tableName: string, fieldOverrides?: Record<string, {
    name?: string;
    type?: number;
}>, wikiSpaceId?: string, wikiParentNodeToken?: string): Promise<{
    app_token: string;
    table_id: string;
    url: string;
    wiki_url?: string;
    total: number;
    fields: {
        csv: string;
        name: string;
        type: string;
    }[];
}>;
