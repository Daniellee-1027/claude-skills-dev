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
export declare function downloadMessageResourceFeishu(params: {
    client: Client;
    messageId: string;
    fileKey: string;
    type: "image" | "file";
}): Promise<DownloadMessageResourceResult>;
