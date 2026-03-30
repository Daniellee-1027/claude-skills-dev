/**
 * Minimal media handling for feishu bridge.
 * Simplified: only download support, no OpenClaw runtime dependency.
 */

import type { Client } from "@larksuiteoapi/node-sdk";

export type DownloadMessageResourceResult = {
  buffer: Buffer;
  contentType?: string;
  fileName?: string;
};

export async function downloadMessageResourceFeishu(params: {
  client: Client;
  messageId: string;
  fileKey: string;
  type: "image" | "file";
}): Promise<DownloadMessageResourceResult> {
  const { client, messageId, fileKey, type } = params;

  const response: any = await client.im.messageResource.get({
    path: { message_id: messageId, file_key: fileKey },
    params: { type },
  });

  // Handle various response formats from the SDK
  if (Buffer.isBuffer(response)) return { buffer: response };
  if (response instanceof ArrayBuffer) return { buffer: Buffer.from(response) };
  if (response?.data && Buffer.isBuffer(response.data)) return { buffer: response.data };
  if (response?.data instanceof ArrayBuffer) return { buffer: Buffer.from(response.data) };

  if (typeof response?.getReadableStream === "function") {
    const stream = response.getReadableStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return { buffer: Buffer.concat(chunks) };
  }

  if (typeof response?.[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of response) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return { buffer: Buffer.concat(chunks) };
  }

  throw new Error("Unexpected response format from Feishu media API");
}
