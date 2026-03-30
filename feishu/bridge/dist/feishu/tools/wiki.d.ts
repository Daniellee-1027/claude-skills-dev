/**
 * Feishu wiki tool core functions.
 * Extracted from openclaw/feishu/src/wiki.ts.
 */
import type * as Lark from "@larksuiteoapi/node-sdk";
export declare function listSpaces(client: Lark.Client): Promise<{
    spaces: {
        space_id: string | undefined;
        name: string | undefined;
        description: string | undefined;
        visibility: "private" | "public" | undefined;
    }[];
}>;
export declare function listNodes(client: Lark.Client, spaceId: string, parentNodeToken?: string): Promise<{
    nodes: {
        node_token: string | undefined;
        obj_token: string | undefined;
        obj_type: "doc" | "bitable" | "sheet" | "mindnote" | "file" | "docx" | "slides";
        title: string | undefined;
        has_child: boolean | undefined;
    }[];
}>;
export declare function getNode(client: Lark.Client, token: string): Promise<{
    node_token: string | undefined;
    space_id: string | undefined;
    obj_token: string | undefined;
    obj_type: "doc" | "bitable" | "sheet" | "mindnote" | "file" | "docx" | "slides" | undefined;
    title: string | undefined;
    parent_node_token: string | undefined;
    has_child: boolean | undefined;
}>;
export declare function createNode(client: Lark.Client, spaceId: string, title: string, objType?: string, parentNodeToken?: string): Promise<{
    node_token: string | undefined;
    obj_token: string | undefined;
    obj_type: "doc" | "bitable" | "sheet" | "mindnote" | "file" | "docx" | "slides" | undefined;
    title: string | undefined;
}>;
export declare function moveNode(client: Lark.Client, spaceId: string, nodeToken: string, targetSpaceId?: string, targetParentToken?: string): Promise<{
    success: boolean;
    node_token: string | undefined;
}>;
export declare function renameNode(client: Lark.Client, spaceId: string, nodeToken: string, title: string): Promise<{
    success: boolean;
    node_token: string;
    title: string;
}>;
export declare function moveDocsToWiki(client: Lark.Client, spaceId: string, objToken: string, objType: string, parentWikiToken?: string): Promise<{
    wiki_token: any;
    url: string;
}>;
export declare function deleteNode(client: Lark.Client, spaceId: string, nodeToken: string): Promise<{
    success: boolean;
    space_id: string;
    node_token: string;
}>;
