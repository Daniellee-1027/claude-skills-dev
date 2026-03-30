/**
 * High-level bitable import: CSV file → Feishu Bitable, one tool call.
 * Handles: create table, infer field types, clean defaults, setup fields, batch import.
 */
import fs from "node:fs";
function inferFieldType(values) {
    const nonEmpty = values.filter(v => v.trim());
    if (nonEmpty.length === 0)
        return { type: 1 };
    const sample = nonEmpty.slice(0, 20);
    // URL
    if (sample.every(v => /^https?:\/\//.test(v.trim())))
        return { type: 15 };
    // Number
    if (sample.every(v => !isNaN(parseFloat(v.trim())) && isFinite(Number(v.trim()))))
        return { type: 2 };
    // Date (YYYY-MM-DD)
    if (sample.every(v => /^\d{4}-\d{2}-\d{2}/.test(v.trim())))
        return { type: 5 };
    // Checkbox
    if (sample.every(v => /^(true|false|是|否|yes|no)$/i.test(v.trim())))
        return { type: 7 };
    // Comma-separated → MultiSelect candidate
    const hasCommas = sample.some(v => v.includes(","));
    if (hasCommas) {
        const allOptions = new Set();
        for (const v of nonEmpty) {
            for (const part of v.split(",")) {
                const t = part.trim();
                if (t)
                    allOptions.add(t);
            }
        }
        if (allOptions.size <= 30) {
            return { type: 4, options: Array.from(allOptions).sort() };
        }
    }
    // SingleSelect candidate
    const unique = new Set(nonEmpty.map(v => v.trim()));
    if (unique.size <= 10 && nonEmpty.length > 20) {
        return { type: 3, options: Array.from(unique).sort() };
    }
    return { type: 1 };
}
const FIELD_TYPE_NAMES = {
    1: "文本", 2: "数字", 3: "单选", 4: "多选", 5: "日期", 7: "复选框", 15: "URL",
};
// --- CSV parsing ---
function parseCSV(content) {
    const lines = content.split("\n");
    if (lines.length < 2)
        throw new Error("CSV file is empty or has no data rows");
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const values = parseCSVLine(line);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ?? "";
        }
        rows.push(row);
    }
    return { headers, rows };
}
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = false;
                }
            }
            else {
                current += ch;
            }
        }
        else {
            if (ch === '"') {
                inQuotes = true;
            }
            else if (ch === ",") {
                result.push(current);
                current = "";
            }
            else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}
// --- Column name → Chinese name ---
function humanizeName(col) {
    // Common patterns
    const map = {
        name: "姓名",
        email: "邮箱",
        phone: "电话",
        company: "公司",
        title: "职位",
        department: "部门",
        url: "链接",
        homepage_url: "个人主页",
        linkedin_url: "LinkedIn",
        scholar_url: "Google Scholar",
        research_areas: "研究方向",
        created_at: "创建时间",
        updated_at: "更新时间",
    };
    const lower = col.toLowerCase();
    if (map[lower])
        return map[lower];
    // Remove common suffixes
    let cleaned = col
        .replace(/_normalized$/i, "")
        .replace(/_clean$/i, "")
        .replace(/_raw$/i, "");
    // Check map again after cleaning
    if (map[cleaned.toLowerCase()])
        return map[cleaned.toLowerCase()];
    // Convert snake_case to readable
    return cleaned.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
// --- Convert row value to bitable field value ---
function convertValue(value, fieldType) {
    const trimmed = value.trim();
    if (!trimmed)
        return undefined; // skip empty
    switch (fieldType) {
        case 2: // Number
            return parseFloat(trimmed);
        case 4: // MultiSelect
            return trimmed.split(",").map(v => v.trim()).filter(Boolean);
        case 5: // DateTime
            return new Date(trimmed).getTime();
        case 7: // Checkbox
            return /^(true|是|yes)$/i.test(trimmed);
        case 15: // URL
            return { text: trimmed, link: trimmed };
        default:
            return trimmed;
    }
}
// --- Main import function ---
export async function importCSVToBitable(client, csvPath, tableName, fieldOverrides, wikiSpaceId, wikiParentNodeToken) {
    // 1. Read and parse CSV
    const content = fs.readFileSync(csvPath, "utf-8");
    const { headers, rows } = parseCSV(content);
    if (rows.length === 0)
        throw new Error("CSV has no data rows");
    // 2. Infer field types
    const fieldSpecs = headers.map(col => {
        const values = rows.map(r => r[col] ?? "");
        const inferred = inferFieldType(values);
        const override = fieldOverrides?.[col];
        return {
            csvCol: col,
            name: override?.name ?? humanizeName(col),
            type: override?.type ?? inferred.type,
            options: inferred.options,
        };
    });
    // 3. Create bitable (directly in wiki if space provided, otherwise in cloud)
    let appToken;
    let url;
    let wikiNodeToken;
    if (wikiSpaceId) {
        // Create bitable node directly in wiki — no move needed
        const wikiRes = await client.wiki.spaceNode.create({
            path: { space_id: wikiSpaceId },
            data: {
                obj_type: "bitable",
                node_type: "origin",
                title: tableName,
                parent_node_token: wikiParentNodeToken,
            },
        });
        if (wikiRes.code !== 0)
            throw new Error(`Create wiki bitable node failed: ${wikiRes.msg}`);
        const node = wikiRes.data?.node;
        appToken = node?.obj_token;
        wikiNodeToken = node?.node_token;
        url = `https://my.feishu.cn/wiki/${wikiNodeToken}`;
    }
    else {
        const createRes = await client.bitable.app.create({
            data: { name: tableName },
        });
        if (createRes.code !== 0)
            throw new Error(`Create bitable failed: ${createRes.msg}`);
        appToken = createRes.data.app.app_token;
        url = createRes.data.app.url ?? `https://my.feishu.cn/base/${appToken}`;
    }
    // Get default table
    const tablesRes = await client.bitable.appTable.list({ path: { app_token: appToken } });
    if (tablesRes.code !== 0)
        throw new Error(`List tables failed: ${tablesRes.msg}`);
    const tableId = tablesRes.data.items[0].table_id;
    // 4. Clean defaults: delete rows
    const existingRecords = await client.bitable.appTableRecord.list({
        path: { app_token: appToken, table_id: tableId },
        params: { page_size: 100 },
    });
    const recordIds = (existingRecords.data?.items ?? []).map(r => r.record_id).filter(Boolean);
    if (recordIds.length > 0) {
        await client.bitable.appTableRecord.batchDelete({
            path: { app_token: appToken, table_id: tableId },
            data: { records: recordIds },
        });
    }
    // 5. Clean defaults: delete extra fields, keep first
    const existingFields = await client.bitable.appTableField.list({
        path: { app_token: appToken, table_id: tableId },
    });
    const existingFieldItems = existingFields.data?.items ?? [];
    const firstFieldId = existingFieldItems[0]?.field_id;
    for (const f of existingFieldItems.slice(1)) {
        await client.bitable.appTableField.delete({
            path: { app_token: appToken, table_id: tableId, field_id: f.field_id },
        });
    }
    // 6. Setup fields: rename first, create rest
    if (firstFieldId && fieldSpecs.length > 0) {
        const first = fieldSpecs[0];
        const body = { field_name: first.name, type: first.type };
        if (first.options && (first.type === 3 || first.type === 4)) {
            body.property = { options: first.options.map(o => ({ name: o })) };
        }
        await client.bitable.appTableField.update({
            path: { app_token: appToken, table_id: tableId, field_id: firstFieldId },
            data: body,
        });
    }
    for (const spec of fieldSpecs.slice(1)) {
        const body = { field_name: spec.name, type: spec.type };
        if (spec.options && (spec.type === 3 || spec.type === 4)) {
            body.property = { options: spec.options.map(o => ({ name: o })) };
        }
        await client.bitable.appTableField.create({
            path: { app_token: appToken, table_id: tableId },
            data: body,
        });
    }
    // 7. Batch import records (500 per batch)
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const records = batch.map(row => {
            const fields = {};
            for (const spec of fieldSpecs) {
                const val = convertValue(row[spec.csvCol] ?? "", spec.type);
                if (val !== undefined) {
                    fields[spec.name] = val;
                }
            }
            return { fields };
        });
        await client.bitable.appTableRecord.batchCreate({
            path: { app_token: appToken, table_id: tableId },
            data: { records },
        });
    }
    return {
        app_token: appToken,
        table_id: tableId,
        url,
        ...(wikiNodeToken && { wiki_url: url }),
        total: rows.length,
        fields: fieldSpecs.map(s => ({ csv: s.csvCol, name: s.name, type: FIELD_TYPE_NAMES[s.type] ?? `type_${s.type}` })),
    };
}
//# sourceMappingURL=bitable-import.js.map