/**
 * Feishu drive tool core functions.
 * Extracted from openclaw/feishu/src/drive.ts.
 */

import type * as Lark from "@larksuiteoapi/node-sdk";

export async function listFolder(client: Lark.Client, folderToken?: string) {
  const validToken = folderToken && folderToken !== "0" ? folderToken : undefined;
  const res = await client.drive.file.list({
    params: validToken ? { folder_token: validToken } : {},
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    files: res.data?.files?.map((f) => ({
      token: f.token, name: f.name, type: f.type, url: f.url,
      created_time: f.created_time, modified_time: f.modified_time,
    })) ?? [],
    next_page_token: res.data?.next_page_token,
  };
}

export async function getFileInfo(client: Lark.Client, fileToken: string, folderToken?: string) {
  const res = await client.drive.file.list({
    params: folderToken ? { folder_token: folderToken } : {},
  });
  if (res.code !== 0) throw new Error(res.msg);
  const file = res.data?.files?.find((f) => f.token === fileToken);
  if (!file) throw new Error(`File not found: ${fileToken}`);
  return {
    token: file.token, name: file.name, type: file.type, url: file.url,
    created_time: file.created_time, modified_time: file.modified_time,
  };
}

export async function createFolder(client: Lark.Client, name: string, folderToken?: string) {
  const effectiveToken = folderToken && folderToken !== "0" ? folderToken : undefined;
  const res = await client.drive.file.createFolder({
    data: { name, folder_token: effectiveToken ?? "" },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { token: res.data?.token, url: res.data?.url };
}

export async function moveFile(client: Lark.Client, fileToken: string, type: string, folderToken: string) {
  const res = await client.drive.file.move({
    path: { file_token: fileToken },
    data: { type: type as any, folder_token: folderToken },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, task_id: res.data?.task_id };
}

export async function deleteFile(client: Lark.Client, fileToken: string, type: string) {
  const res = await client.drive.file.delete({
    path: { file_token: fileToken },
    params: { type: type as any },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, task_id: res.data?.task_id };
}
