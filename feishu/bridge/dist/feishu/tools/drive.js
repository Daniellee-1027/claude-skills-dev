/**
 * Feishu drive tool core functions.
 * Extracted from openclaw/feishu/src/drive.ts.
 */
export async function listFolder(client, folderToken) {
    const validToken = folderToken && folderToken !== "0" ? folderToken : undefined;
    const res = await client.drive.file.list({
        params: validToken ? { folder_token: validToken } : {},
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return {
        files: res.data?.files?.map((f) => ({
            token: f.token, name: f.name, type: f.type, url: f.url,
            created_time: f.created_time, modified_time: f.modified_time,
        })) ?? [],
        next_page_token: res.data?.next_page_token,
    };
}
export async function getFileInfo(client, fileToken, folderToken) {
    const res = await client.drive.file.list({
        params: folderToken ? { folder_token: folderToken } : {},
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    const file = res.data?.files?.find((f) => f.token === fileToken);
    if (!file)
        throw new Error(`File not found: ${fileToken}`);
    return {
        token: file.token, name: file.name, type: file.type, url: file.url,
        created_time: file.created_time, modified_time: file.modified_time,
    };
}
export async function createFolder(client, name, folderToken) {
    const effectiveToken = folderToken && folderToken !== "0" ? folderToken : undefined;
    const res = await client.drive.file.createFolder({
        data: { name, folder_token: effectiveToken ?? "" },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { token: res.data?.token, url: res.data?.url };
}
export async function moveFile(client, fileToken, type, folderToken) {
    const res = await client.drive.file.move({
        path: { file_token: fileToken },
        data: { type: type, folder_token: folderToken },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, task_id: res.data?.task_id };
}
export async function deleteFile(client, fileToken, type) {
    const res = await client.drive.file.delete({
        path: { file_token: fileToken },
        params: { type: type },
    });
    if (res.code !== 0)
        throw new Error(res.msg);
    return { success: true, task_id: res.data?.task_id };
}
//# sourceMappingURL=drive.js.map