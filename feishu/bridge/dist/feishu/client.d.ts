/**
 * Feishu SDK client factory.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/client.ts.
 */
import * as Lark from "@larksuiteoapi/node-sdk";
import type { FeishuDomain } from "./types.js";
export type FeishuClientCredentials = {
    accountId?: string;
    appId?: string;
    appSecret?: string;
    domain?: FeishuDomain;
};
export declare function createFeishuClient(creds: FeishuClientCredentials): Lark.Client;
export declare function createFeishuWSClient(creds: FeishuClientCredentials): Lark.WSClient;
export declare function createEventDispatcher(creds: {
    encryptKey?: string;
    verificationToken?: string;
}): Lark.EventDispatcher;
