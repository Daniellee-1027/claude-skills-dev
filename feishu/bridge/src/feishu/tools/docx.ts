/**
 * Feishu document tool core functions.
 * Extracted from openclaw/feishu/src/docx.ts — pure Lark SDK calls, no OpenClaw deps.
 */

import { Readable } from "stream";
import type * as Lark from "@larksuiteoapi/node-sdk";

const BLOCK_TYPE_NAMES: Record<number, string> = {
  1: "Page", 2: "Text", 3: "Heading1", 4: "Heading2", 5: "Heading3",
  12: "Bullet", 13: "Ordered", 14: "Code", 15: "Quote", 17: "Todo",
  18: "Bitable", 21: "Diagram", 22: "Divider", 23: "File", 27: "Image",
  30: "Sheet", 31: "Table", 32: "TableCell",
};

const STRUCTURED_BLOCK_TYPES = new Set([14, 18, 21, 23, 27, 30, 31, 32]);
const UNSUPPORTED_CREATE_TYPES = new Set([31, 32]);

function cleanBlocksForInsert(blocks: any[]): { cleaned: any[]; skipped: string[] } {
  const skipped: string[] = [];
  const cleaned = blocks.filter((block) => {
    if (UNSUPPORTED_CREATE_TYPES.has(block.block_type)) {
      skipped.push(BLOCK_TYPE_NAMES[block.block_type] || `type_${block.block_type}`);
      return false;
    }
    return true;
  });
  return { cleaned, skipped };
}

async function convertMarkdown(client: Lark.Client, markdown: string) {
  const res = await client.docx.document.convert({
    data: { content_type: "markdown", content: markdown },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return {
    blocks: res.data?.blocks ?? [],
    firstLevelBlockIds: res.data?.first_level_block_ids ?? [],
  };
}

function sortBlocksByFirstLevel(blocks: any[], firstLevelIds: string[]): any[] {
  if (!firstLevelIds || firstLevelIds.length === 0) return blocks;
  const sorted = firstLevelIds.map((id) => blocks.find((b) => b.block_id === id)).filter(Boolean);
  const sortedIds = new Set(firstLevelIds);
  const remaining = blocks.filter((b) => !sortedIds.has(b.block_id));
  return [...sorted, ...remaining];
}

async function insertBlocks(client: Lark.Client, docToken: string, blocks: any[], parentBlockId?: string) {
  const { cleaned, skipped } = cleanBlocksForInsert(blocks);
  const blockId = parentBlockId ?? docToken;
  if (cleaned.length === 0) return { children: [], skipped };
  const res = await client.docx.documentBlockChildren.create({
    path: { document_id: docToken, block_id: blockId },
    data: { children: cleaned },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { children: res.data?.children ?? [], skipped };
}

async function clearDocumentContent(client: Lark.Client, docToken: string) {
  const existing = await client.docx.documentBlock.list({ path: { document_id: docToken } });
  if (existing.code !== 0) throw new Error(existing.msg);
  const childIds = existing.data?.items
    ?.filter((b) => b.parent_id === docToken && b.block_type !== 1)
    .map((b) => b.block_id) ?? [];
  if (childIds.length > 0) {
    const res = await client.docx.documentBlockChildren.batchDelete({
      path: { document_id: docToken, block_id: docToken },
      data: { start_index: 0, end_index: childIds.length },
    });
    if (res.code !== 0) throw new Error(res.msg);
  }
  return childIds.length;
}

function extractImageUrls(markdown: string): string[] {
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const url = match[1].trim();
    if (url.startsWith("http://") || url.startsWith("https://")) urls.push(url);
  }
  return urls;
}

async function uploadImageToDocx(client: Lark.Client, blockId: string, imageBuffer: Buffer, fileName: string): Promise<string> {
  const res = await client.drive.media.uploadAll({
    data: {
      file_name: fileName,
      parent_type: "docx_image",
      parent_node: blockId,
      size: imageBuffer.length,
      file: Readable.from(imageBuffer) as any,
    },
  });
  const fileToken = res?.file_token;
  if (!fileToken) throw new Error("Image upload failed: no file_token returned");
  return fileToken;
}

async function processImages(client: Lark.Client, docToken: string, markdown: string, insertedBlocks: any[]): Promise<number> {
  const imageUrls = extractImageUrls(markdown);
  if (imageUrls.length === 0) return 0;
  const imageBlocks = insertedBlocks.filter((b) => b.block_type === 27);
  let processed = 0;
  for (let i = 0; i < Math.min(imageUrls.length, imageBlocks.length); i++) {
    const url = imageUrls[i];
    const blockId = imageBlocks[i].block_id;
    try {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const urlPath = new URL(url).pathname;
      const fileName = urlPath.split("/").pop() || `image_${i}.png`;
      const fileToken = await uploadImageToDocx(client, blockId, buffer, fileName);
      await client.docx.documentBlock.patch({
        path: { document_id: docToken, block_id: blockId },
        data: { replace_image: { token: fileToken } },
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process image ${url}:`, err);
    }
  }
  return processed;
}

// ============ Exported Actions ============

export async function readDoc(client: Lark.Client, docToken: string) {
  const [contentRes, infoRes, blocksRes] = await Promise.all([
    client.docx.document.rawContent({ path: { document_id: docToken } }),
    client.docx.document.get({ path: { document_id: docToken } }),
    client.docx.documentBlock.list({ path: { document_id: docToken } }),
  ]);
  if (contentRes.code !== 0) throw new Error(contentRes.msg);
  const blocks = blocksRes.data?.items ?? [];
  const structuredTypes: string[] = [];
  for (const b of blocks) {
    const type = b.block_type ?? 0;
    const name = BLOCK_TYPE_NAMES[type] || `type_${type}`;
    if (STRUCTURED_BLOCK_TYPES.has(type) && !structuredTypes.includes(name)) structuredTypes.push(name);
  }
  let hint: string | undefined;
  if (structuredTypes.length > 0) {
    hint = `This document contains ${structuredTypes.join(", ")} which are NOT included in the plain text above. Use feishu_doc with action: "list_blocks" to get full content.`;
  }
  return {
    title: infoRes.data?.document?.title,
    content: contentRes.data?.content,
    revision_id: infoRes.data?.document?.revision_id,
    block_count: blocks.length,
    ...(hint && { hint }),
  };
}

export async function createDoc(client: Lark.Client, title: string, folderToken?: string) {
  const res = await client.docx.document.create({ data: { title, folder_token: folderToken } });
  if (res.code !== 0) throw new Error(res.msg);
  const doc = res.data?.document;
  return {
    document_id: doc?.document_id,
    title: doc?.title,
    url: `https://feishu.cn/docx/${doc?.document_id}`,
  };
}

export async function writeDoc(client: Lark.Client, docToken: string, markdown: string) {
  const deleted = await clearDocumentContent(client, docToken);
  const { blocks, firstLevelBlockIds } = await convertMarkdown(client, markdown);
  if (blocks.length === 0) return { success: true, blocks_deleted: deleted, blocks_added: 0, images_processed: 0 };
  const sortedBlocks = sortBlocksByFirstLevel(blocks, firstLevelBlockIds);
  const { children: inserted, skipped } = await insertBlocks(client, docToken, sortedBlocks);
  const imagesProcessed = await processImages(client, docToken, markdown, inserted);
  return {
    success: true, blocks_deleted: deleted, blocks_added: inserted.length,
    images_processed: imagesProcessed,
    ...(skipped.length > 0 && { warning: `Skipped unsupported block types: ${skipped.join(", ")}` }),
  };
}

export async function appendDoc(client: Lark.Client, docToken: string, markdown: string) {
  const { blocks, firstLevelBlockIds } = await convertMarkdown(client, markdown);
  if (blocks.length === 0) throw new Error("Content is empty");
  const sortedBlocks = sortBlocksByFirstLevel(blocks, firstLevelBlockIds);
  const { children: inserted, skipped } = await insertBlocks(client, docToken, sortedBlocks);
  const imagesProcessed = await processImages(client, docToken, markdown, inserted);
  return {
    success: true, blocks_added: inserted.length, images_processed: imagesProcessed,
    block_ids: inserted.map((b: any) => b.block_id),
    ...(skipped.length > 0 && { warning: `Skipped unsupported block types: ${skipped.join(", ")}` }),
  };
}

export async function updateBlock(client: Lark.Client, docToken: string, blockId: string, content: string) {
  const blockInfo = await client.docx.documentBlock.get({ path: { document_id: docToken, block_id: blockId } });
  if (blockInfo.code !== 0) throw new Error(blockInfo.msg);
  const res = await client.docx.documentBlock.patch({
    path: { document_id: docToken, block_id: blockId },
    data: { update_text_elements: { elements: [{ text_run: { content } }] } },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, block_id: blockId };
}

export async function deleteBlock(client: Lark.Client, docToken: string, blockId: string) {
  const blockInfo = await client.docx.documentBlock.get({ path: { document_id: docToken, block_id: blockId } });
  if (blockInfo.code !== 0) throw new Error(blockInfo.msg);
  const parentId = blockInfo.data?.block?.parent_id ?? docToken;
  const children = await client.docx.documentBlockChildren.get({ path: { document_id: docToken, block_id: parentId } });
  if (children.code !== 0) throw new Error(children.msg);
  const items = children.data?.items ?? [];
  const index = items.findIndex((item: any) => item.block_id === blockId);
  if (index === -1) throw new Error("Block not found");
  const res = await client.docx.documentBlockChildren.batchDelete({
    path: { document_id: docToken, block_id: parentId },
    data: { start_index: index, end_index: index + 1 },
  });
  if (res.code !== 0) throw new Error(res.msg);
  return { success: true, deleted_block_id: blockId };
}

export async function listBlocks(client: Lark.Client, docToken: string) {
  const res = await client.docx.documentBlock.list({ path: { document_id: docToken } });
  if (res.code !== 0) throw new Error(res.msg);
  return { blocks: res.data?.items ?? [] };
}

export async function getBlock(client: Lark.Client, docToken: string, blockId: string) {
  const res = await client.docx.documentBlock.get({ path: { document_id: docToken, block_id: blockId } });
  if (res.code !== 0) throw new Error(res.msg);
  return { block: res.data?.block };
}
