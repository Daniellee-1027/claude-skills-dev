/**
 * Feishu SDK client factory.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/client.ts.
 */

import * as Lark from "@larksuiteoapi/node-sdk";
import type { FeishuDomain } from "./types.js";

const clientCache = new Map<
  string,
  {
    client: Lark.Client;
    config: { appId: string; appSecret: string; domain?: FeishuDomain };
  }
>();

function resolveDomain(domain: FeishuDomain | undefined): Lark.Domain | string {
  if (domain === "lark") {
    return Lark.Domain.Lark;
  }
  if (domain === "feishu" || !domain) {
    return Lark.Domain.Feishu;
  }
  return domain.replace(/\/+$/, "");
}

export type FeishuClientCredentials = {
  accountId?: string;
  appId?: string;
  appSecret?: string;
  domain?: FeishuDomain;
};

export function createFeishuClient(creds: FeishuClientCredentials): Lark.Client {
  const { accountId = "default", appId, appSecret, domain } = creds;

  if (!appId || !appSecret) {
    throw new Error(`Feishu credentials not configured for account "${accountId}"`);
  }

  const cached = clientCache.get(accountId);
  if (
    cached &&
    cached.config.appId === appId &&
    cached.config.appSecret === appSecret &&
    cached.config.domain === domain
  ) {
    return cached.client;
  }

  const client = new Lark.Client({
    appId,
    appSecret,
    appType: Lark.AppType.SelfBuild,
    domain: resolveDomain(domain),
  });

  clientCache.set(accountId, {
    client,
    config: { appId, appSecret, domain },
  });

  return client;
}

export function createFeishuWSClient(creds: FeishuClientCredentials): Lark.WSClient {
  const { appId, appSecret, domain } = creds;

  if (!appId || !appSecret) {
    throw new Error("Feishu credentials not configured");
  }

  return new Lark.WSClient({
    appId,
    appSecret,
    domain: resolveDomain(domain),
    loggerLevel: Lark.LoggerLevel.info,
  });
}

export function createEventDispatcher(creds: {
  encryptKey?: string;
  verificationToken?: string;
}): Lark.EventDispatcher {
  return new Lark.EventDispatcher({
    encryptKey: creds.encryptKey,
    verificationToken: creds.verificationToken,
  });
}
