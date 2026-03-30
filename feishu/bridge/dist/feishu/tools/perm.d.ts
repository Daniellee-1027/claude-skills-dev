/**
 * Feishu permission tool core functions.
 * Extracted from openclaw/feishu/src/perm.ts.
 */
import type * as Lark from "@larksuiteoapi/node-sdk";
export declare function listMembers(client: Lark.Client, token: string, type: string): Promise<{
    members: {
        member_type: "email" | "openid" | "unionid" | "openchat" | "opendepartmentid" | "userid" | "groupid" | "wikispaceid";
        member_id: string;
        perm: "view" | "edit" | "full_access";
        name: string | undefined;
    }[];
}>;
export declare function addMember(client: Lark.Client, token: string, type: string, memberType: string, memberId: string, perm: string): Promise<{
    success: boolean;
    member: {
        member_type: "email" | "openid" | "unionid" | "openchat" | "opendepartmentid" | "userid" | "groupid" | "wikispaceid";
        member_id: string;
        perm: "view" | "edit" | "full_access";
        perm_type?: "container" | "single_page" | undefined;
        type?: "user" | "chat" | "department" | "group" | "wiki_space_member" | "wiki_space_viewer" | "wiki_space_editor" | undefined;
    } | undefined;
}>;
export declare function removeMember(client: Lark.Client, token: string, type: string, memberType: string, memberId: string): Promise<{
    success: boolean;
}>;
