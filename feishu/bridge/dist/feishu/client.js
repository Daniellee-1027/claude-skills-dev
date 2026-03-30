/**
 * Feishu SDK client factory.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/client.ts.
 */
import * as Lark from "@larksuiteoapi/node-sdk";
const clientCache = new Map();
function resolveDomain(domain) {
    if (domain === "lark") {
        return Lark.Domain.Lark;
    }
    if (domain === "feishu" || !domain) {
        return Lark.Domain.Feishu;
    }
    return domain.replace(/\/+$/, "");
}
export function createFeishuClient(creds) {
    const { accountId = "default", appId, appSecret, domain } = creds;
    if (!appId || !appSecret) {
        throw new Error(`Feishu credentials not configured for account "${accountId}"`);
    }
    const cached = clientCache.get(accountId);
    if (cached &&
        cached.config.appId === appId &&
        cached.config.appSecret === appSecret &&
        cached.config.domain === domain) {
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
export function createFeishuWSClient(creds) {
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
export function createEventDispatcher(creds) {
    return new Lark.EventDispatcher({
        encryptKey: creds.encryptKey,
        verificationToken: creds.verificationToken,
    });
}
//# sourceMappingURL=client.js.map