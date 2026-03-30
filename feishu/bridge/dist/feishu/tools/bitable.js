/**
 * Feishu bitable tool core functions.
 * Extracted from openclaw/feishu/src/bitable.ts.
 */
const FIELD_TYPE_NAMES = {
    1: "Text", 2: "Number", 3: "SingleSelect", 4: "MultiSelect", 5: "DateTime",
    7: "Checkbox", 11: "User", 13: "Phone", 15: "URL", 17: "Attachment",
    18: "SingleLink", 19: "Lookup", 20: "Formula", 21: "DuplexLink",
    22: "Location", 23: "GroupChat", 1001: "CreatedTime", 1002: "ModifiedTime",
    1003: "CreatedUser", 1004: "ModifiedUser", 1005: "AutoNumber",
};
function parseBitableUrl(url) {
    try {
        const u = new URL(url);
        const tableId = u.searchParams.get("table") ?? undefined;
        const wikiMatch = u.pathname.match(/\/wiki\/([A-Za-z0-9]+)/);
        if (wikiMatch)
            return { token: wikiMatch[1], tableId, isWiki: true };
        const baseMatch = u.pathname.match(/\/base\/([A-Za-z0-9]+)/);
        if (baseMatch)
            return { token: baseMatch[1], tableId, isWiki: false };
        return null;
    }
    catch {
        return null;
    }
}
async function getAppTokenFromWiki(client, nodeToken) {
    const res = await client.wiki.space.getNode({ params: { token: nodeToken } });
    if (res.code !== 0)
        throw new Error(res.msg);
    const node = res.data?.node;
    if (!node)
        throw new Error("Node not found");
    if (node.obj_type !== "bitable")
        throw new Error(`Node is not a bitable (type: ${node.obj_type})`);
    return node.obj_token;
}
export async function getBitableMeta(client, url) {
    const parsed = parseBitableUrl(url);
    if (!parsed)
        throw new Error("Invalid URL format. Expected /base/XXX or /wiki/XXX URL");
    let appToken;
    if (parsed.isWiki)
        appToken = await getAppTokenFromWiki(client, parsed.token);
    else
        appToken = parsed.token;
    const res = await client.bitable.app.get({ path: { app_token: appToken } });
    if (res.code !== 0)
        throw new Error(res.msg);
    let tables = [];
    if (!parsed.tableId) {
        const tablesRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
        if (tablesRes.code === 0) {
            tables = (tablesRes.data?.items ?? []).map((t) => ({ table_id: t.table_id, name: t.name }));
        }
    }
    return {
        app_token: appToken, table_id: parsed.tableId, name: res.data?.app?.name,
        url_type: parsed.isWiki ? "wiki" : "base",
        ...(tables.length > 0 && { tables }),
        hint: parsed.tableId
            ? `Use app_token="${appToken}" and table_id="${parsed.tableId}" for other bitable tools`
            : `Use app_token="${appToken}" for other bitable tools. Select a table_id from the tables list.`,
    };
}
export async function listFields(client, appToken, tableId) {
    const res = await client.bitable.appTableField.list({ path: { app_token: appToken, table_id: tableId } });
    if (res.code !== 0)
        throw new Error(res.msg);
    const fields = res.data?.items ?? [];
    return {
        fields: fields.map((f) => ({
            field_id: f.field_id, field_name: f.field_name, type: f.type,
            type_name: FIELD_TYPE_NAMES[f.type ?? 0] || `type_${f.type}`,
            is_primary: f.is_primary, ...(f.property && { property: f.property }),
        })),
        total: fields.length,
    };
}
export async function listRecords(client, appToken, tableId, pageSize, pageToken) {
    const res = await client.bitable.appTableRecord.list({
        path: { app_token: appToken, table_id: tableId },
        params: { page_size: pageSize ?? 100, ...(pageToken && { page_token: pageToken }) },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        records: res.data?.items ?? [],
        has_more: res.data?.has_more ?? false,
        page_token: res.data?.page_token,
        total: res.data?.total,
    };
}
export async function getRecord(client, appToken, tableId, recordId) {
    const res = await client.bitable.appTableRecord.get({
        path: { app_token: appToken, table_id: tableId, record_id: recordId },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { record: res.data?.record };
}
export async function createRecord(client, appToken, tableId, fields) {
    const res = await client.bitable.appTableRecord.create({
        path: { app_token: appToken, table_id: tableId },
        data: { fields: fields },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { record: res.data?.record };
}
export async function updateRecord(client, appToken, tableId, recordId, fields) {
    const res = await client.bitable.appTableRecord.update({
        path: { app_token: appToken, table_id: tableId, record_id: recordId },
        data: { fields: fields },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { record: res.data?.record };
}
export async function createField(client, appToken, tableId, fieldName, fieldType, property) {
    const res = await client.bitable.appTableField.create({
        path: { app_token: appToken, table_id: tableId },
        data: { field_name: fieldName, type: fieldType, ...(property && { property }) },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        field_id: res.data?.field?.field_id, field_name: res.data?.field?.field_name,
        type: res.data?.field?.type,
        type_name: FIELD_TYPE_NAMES[res.data?.field?.type ?? 0] || `type_${res.data?.field?.type}`,
    };
}
export async function createApp(client, name, folderToken) {
    const res = await client.bitable.app.create({
        data: { name, ...(folderToken && { folder_token: folderToken }) },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    const appToken = res.data?.app?.app_token;
    if (!appToken)
        throw new Error("Failed to create Bitable: no app_token returned");
    let tableId;
    try {
        const tablesRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
        if (tablesRes.code === 0 && tablesRes.data?.items && tablesRes.data.items.length > 0) {
            tableId = tablesRes.data.items[0].table_id ?? undefined;
        }
    }
    catch { }
    return {
        app_token: appToken, table_id: tableId, name: res.data?.app?.name, url: res.data?.app?.url,
        hint: tableId
            ? `Table created. Use app_token="${appToken}" and table_id="${tableId}" for other bitable tools.`
            : "Table created. Use feishu_bitable_get_meta to get table_id and field details.",
    };
}
export async function batchCreateRecords(client, appToken, tableId, records) {
    const res = await client.bitable.appTableRecord.batchCreate({
        path: { app_token: appToken, table_id: tableId },
        data: { records: records.map(fields => ({ fields })) },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { records: res.data?.records ?? [], total: res.data?.records?.length ?? 0 };
}
export async function batchDeleteRecords(client, appToken, tableId, recordIds) {
    const res = await client.bitable.appTableRecord.batchDelete({
        path: { app_token: appToken, table_id: tableId },
        data: { records: recordIds },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, deleted: recordIds.length };
}
export async function renameField(client, appToken, tableId, fieldId, fieldName) {
    // Must include current field type — fetch it first
    const getRes = await client.bitable.appTableField.list({ path: { app_token: appToken, table_id: tableId } });
    if (getRes.code !== 0)
        throw new Error(getRes.msg);
    const field = (getRes.data?.items ?? []).find(f => f.field_id === fieldId);
    if (!field)
        throw new Error(`Field ${fieldId} not found`);
    const res = await client.bitable.appTableField.update({
        path: { app_token: appToken, table_id: tableId, field_id: fieldId },
        data: { field_name: fieldName, type: field.type },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { field_id: res.data?.field?.field_id, field_name: res.data?.field?.field_name };
}
export async function deleteField(client, appToken, tableId, fieldId) {
    const res = await client.bitable.appTableField.delete({
        path: { app_token: appToken, table_id: tableId, field_id: fieldId },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, deleted: true };
}
export async function createView(client, appToken, tableId, viewName, viewType = "grid") {
    const res = await client.bitable.appTableView.create({
        path: { app_token: appToken, table_id: tableId },
        data: { view_name: viewName, view_type: viewType },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { view_id: res.data?.view?.view_id, view_name: res.data?.view?.view_name };
}
export async function deleteRecord(client, appToken, tableId, recordId) {
    const res = await client.bitable.appTableRecord.delete({
        path: { app_token: appToken, table_id: tableId, record_id: recordId },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, deleted: true };
}
//# sourceMappingURL=bitable.js.map