/**
 * Feishu drive tool core functions.
 * Extracted from openclaw/feishu/src/drive.ts.
 */
import type * as Lark from "@larksuiteoapi/node-sdk";
export declare function listFolder(client: Lark.Client, folderToken?: string): Promise<{
    files: {
        token: string;
        name: string;
        type: string;
        url: string | undefined;
        created_time: string | undefined;
        modified_time: string | undefined;
    }[];
    next_page_token: string | undefined;
}>;
export declare function getFileInfo(client: Lark.Client, fileToken: string, folderToken?: string): Promise<{
    token: string;
    name: string;
    type: string;
    url: string | undefined;
    created_time: string | undefined;
    modified_time: string | undefined;
}>;
export declare function createFolder(client: Lark.Client, name: string, folderToken?: string): Promise<{
    token: string | undefined;
    url: string | undefined;
}>;
export declare function moveFile(client: Lark.Client, fileToken: string, type: string, folderToken: string): Promise<{
    success: boolean;
    task_id: string | undefined;
}>;
export declare function deleteFile(client: Lark.Client, fileToken: string, type: string): Promise<{
    success: boolean;
    task_id: string | undefined;
}>;
