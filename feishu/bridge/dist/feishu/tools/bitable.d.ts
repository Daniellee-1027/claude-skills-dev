/**
 * Feishu bitable tool core functions.
 * Extracted from openclaw/feishu/src/bitable.ts.
 */
import type * as Lark from "@larksuiteoapi/node-sdk";
export declare function getBitableMeta(client: Lark.Client, url: string): Promise<{
    hint: string;
    tables?: {
        table_id: string;
        name: string;
    }[] | undefined;
    app_token: string;
    table_id: string | undefined;
    name: string | undefined;
    url_type: string;
}>;
export declare function listFields(client: Lark.Client, appToken: string, tableId: string): Promise<{
    fields: {
        property?: {
            options?: {
                name?: string | undefined;
                id?: string | undefined;
                color?: number | undefined;
            }[] | undefined;
            formatter?: string | undefined;
            date_formatter?: string | undefined;
            auto_fill?: boolean | undefined;
            multiple?: boolean | undefined;
            table_id?: string | undefined;
            table_name?: string | undefined;
            back_field_name?: string | undefined;
            auto_serial?: {
                type: "custom" | "auto_increment_number";
                options?: {
                    type: "system_number" | "fixed_text" | "created_time";
                    value: string;
                }[] | undefined;
            } | undefined;
            location?: {
                input_type: "only_mobile" | "not_limit";
            } | undefined;
            formula_expression?: string | undefined;
            allowed_edit_modes?: {
                manual?: boolean | undefined;
                scan?: boolean | undefined;
            } | undefined;
            min?: number | undefined;
            max?: number | undefined;
            range_customize?: boolean | undefined;
            currency_code?: string | undefined;
            rating?: {
                symbol?: string | undefined;
            } | undefined;
            type?: {
                data_type: number;
                ui_property?: {
                    currency_code?: string | undefined;
                    formatter?: string | undefined;
                    range_customize?: boolean | undefined;
                    min?: number | undefined;
                    max?: number | undefined;
                    date_formatter?: string | undefined;
                    rating?: {
                        symbol?: string | undefined;
                    } | undefined;
                } | undefined;
                ui_type?: "Number" | "Progress" | "Currency" | "Rating" | "DateTime" | undefined;
            } | undefined;
            filter_info?: {
                target_table?: string | undefined;
                filter_info?: {
                    conjunction: "and" | "or";
                    conditions: Array<{
                        field_id: string;
                        operator: "is" | "isNot" | "contains" | "doesNotContain" | "isEmpty" | "isNotEmpty" | "isGreater" | "isGreaterEqual" | "isLess" | "isLessEqual";
                        value?: string;
                        condition_id?: string;
                        field_type?: number;
                    }>;
                } | undefined;
            } | undefined;
        } | undefined;
        field_id: string | undefined;
        field_name: string;
        type: number;
        type_name: string;
        is_primary: boolean | undefined;
    }[];
    total: number;
}>;
export declare function listRecords(client: Lark.Client, appToken: string, tableId: string, pageSize?: number, pageToken?: string): Promise<{
    records: {
        fields: Record<string, string | number | number | number | boolean | {
            text?: string;
            link?: string;
        } | {
            location?: string;
            pname?: string;
            cityname?: string;
            adname?: string;
            address?: string;
            name?: string;
            full_address?: string;
        } | Array<{
            id?: string;
            name?: string;
            avatar_url?: string;
        }> | Array<string> | Array<{
            id?: string;
            name?: string;
            en_name?: string;
            email?: string;
            avatar_url?: string;
        }> | Array<{
            file_token?: string;
            name?: string;
            type?: string;
            size?: number;
            url?: string;
            tmp_url?: string;
        }>>;
        record_id?: string | undefined;
        created_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        created_time?: number | undefined;
        last_modified_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        last_modified_time?: number | undefined;
        shared_url?: string | undefined;
        record_url?: string | undefined;
    }[];
    has_more: boolean;
    page_token: string | undefined;
    total: number | undefined;
}>;
export declare function getRecord(client: Lark.Client, appToken: string, tableId: string, recordId: string): Promise<{
    record: {
        fields: Record<string, string | number | number | number | boolean | {
            text?: string;
            link?: string;
        } | {
            location?: string;
            pname?: string;
            cityname?: string;
            adname?: string;
            address?: string;
            name?: string;
            full_address?: string;
        } | Array<{
            id?: string;
            name?: string;
            avatar_url?: string;
        }> | Array<string> | Array<{
            id?: string;
            name?: string;
            en_name?: string;
            email?: string;
            avatar_url?: string;
        }> | Array<{
            file_token?: string;
            name?: string;
            type?: string;
            size?: number;
            url?: string;
            tmp_url?: string;
        }>>;
        record_id?: string | undefined;
        created_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        created_time?: number | undefined;
        last_modified_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        last_modified_time?: number | undefined;
        shared_url?: string | undefined;
        record_url?: string | undefined;
    } | undefined;
}>;
export declare function createRecord(client: Lark.Client, appToken: string, tableId: string, fields: Record<string, unknown>): Promise<{
    record: {
        fields: Record<string, string | number | number | number | boolean | {
            text?: string;
            link?: string;
        } | {
            location?: string;
            pname?: string;
            cityname?: string;
            adname?: string;
            address?: string;
            name?: string;
            full_address?: string;
        } | Array<{
            id?: string;
            name?: string;
            avatar_url?: string;
        }> | Array<string> | Array<{
            id?: string;
            name?: string;
            en_name?: string;
            email?: string;
            avatar_url?: string;
        }> | Array<{
            file_token?: string;
            name?: string;
            type?: string;
            size?: number;
            url?: string;
            tmp_url?: string;
        }>>;
        record_id?: string | undefined;
        created_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        created_time?: number | undefined;
        last_modified_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        last_modified_time?: number | undefined;
        shared_url?: string | undefined;
        record_url?: string | undefined;
    } | undefined;
}>;
export declare function updateRecord(client: Lark.Client, appToken: string, tableId: string, recordId: string, fields: Record<string, unknown>): Promise<{
    record: {
        fields: Record<string, string | number | number | number | boolean | {
            text?: string;
            link?: string;
        } | {
            location?: string;
            pname?: string;
            cityname?: string;
            adname?: string;
            address?: string;
            name?: string;
            full_address?: string;
        } | Array<{
            id?: string;
            name?: string;
            avatar_url?: string;
        }> | Array<string> | Array<{
            id?: string;
            name?: string;
            en_name?: string;
            email?: string;
            avatar_url?: string;
        }> | Array<{
            file_token?: string;
            name?: string;
            type?: string;
            size?: number;
            url?: string;
            tmp_url?: string;
        }>>;
        record_id?: string | undefined;
        created_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        created_time?: number | undefined;
        last_modified_by?: {
            id?: string | undefined;
            name?: string | undefined;
            en_name?: string | undefined;
            email?: string | undefined;
            avatar_url?: string | undefined;
        } | undefined;
        last_modified_time?: number | undefined;
        shared_url?: string | undefined;
        record_url?: string | undefined;
    } | undefined;
}>;
export declare function createField(client: Lark.Client, appToken: string, tableId: string, fieldName: string, fieldType: number, property?: Record<string, unknown>): Promise<{
    field_id: string | undefined;
    field_name: string | undefined;
    type: number | undefined;
    type_name: string;
}>;
export declare function createApp(client: Lark.Client, name: string, folderToken?: string): Promise<{
    app_token: string;
    table_id: string | undefined;
    name: string | undefined;
    url: string | undefined;
    hint: string;
}>;
export declare function batchCreateRecords(client: Lark.Client, appToken: string, tableId: string, records: Record<string, unknown>[]): Promise<{
    records: any;
    total: any;
}>;
export declare function batchDeleteRecords(client: Lark.Client, appToken: string, tableId: string, recordIds: string[]): Promise<{
    success: boolean;
    deleted: number;
}>;
export declare function renameField(client: Lark.Client, appToken: string, tableId: string, fieldId: string, fieldName: string): Promise<{
    field_id: string | undefined;
    field_name: string | undefined;
}>;
export declare function deleteField(client: Lark.Client, appToken: string, tableId: string, fieldId: string): Promise<{
    success: boolean;
    deleted: boolean;
}>;
export declare function createView(client: Lark.Client, appToken: string, tableId: string, viewName: string, viewType?: string): Promise<{
    view_id: any;
    view_name: any;
}>;
export declare function deleteRecord(client: Lark.Client, appToken: string, tableId: string, recordId: string): Promise<{
    success: boolean;
    deleted: boolean;
}>;
