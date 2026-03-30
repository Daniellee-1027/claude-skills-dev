/**
 * Feishu Streaming Card — Card Kit streaming API for real-time text output.
 * Zero OpenClaw dependency — copied from openclaw/feishu/src/streaming-card.ts.
 */
import { buildFormattedCard, buildSummaryCard, updateCardFeishu } from "./send.js";
const tokenCache = new Map();
function resolveApiBase(domain) {
    if (domain === "lark")
        return "https://open.larksuite.com/open-apis";
    if (domain && domain !== "feishu" && domain.startsWith("http"))
        return `${domain.replace(/\/+$/, "")}/open-apis`;
    return "https://open.feishu.cn/open-apis";
}
async function getToken(creds) {
    const key = `${creds.domain ?? "feishu"}|${creds.appId}`;
    const cached = tokenCache.get(key);
    if (cached && cached.expiresAt > Date.now() + 60000)
        return cached.token;
    const res = await fetch(`${resolveApiBase(creds.domain)}/auth/v3/tenant_access_token/internal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: creds.appId, app_secret: creds.appSecret }),
    });
    const data = (await res.json());
    if (data.code !== 0 || !data.tenant_access_token) {
        throw new Error(`Token error: ${data.msg}`);
    }
    tokenCache.set(key, {
        token: data.tenant_access_token,
        expiresAt: Date.now() + (data.expire ?? 7200) * 1000,
    });
    return data.tenant_access_token;
}
function truncateSummary(text, max = 50) {
    if (!text)
        return "";
    const clean = text.replace(/\n/g, " ").trim();
    return clean.length <= max ? clean : clean.slice(0, max - 3) + "...";
}
export class FeishuStreamingSession {
    client;
    creds;
    state = null;
    queue = Promise.resolve();
    closed = false;
    log;
    lastUpdateTime = 0;
    pendingText = null;
    updateThrottleMs = 100;
    constructor(client, creds, log) {
        this.client = client;
        this.creds = creds;
        this.log = log;
    }
    async start(receiveId, receiveIdType = "chat_id") {
        if (this.state)
            return;
        const apiBase = resolveApiBase(this.creds.domain);
        const cardJson = {
            schema: "2.0",
            config: {
                streaming_mode: true,
                summary: { content: "[Generating...]" },
                streaming_config: { print_frequency_ms: { default: 50 }, print_step: { default: 2 } },
            },
            body: {
                elements: [{ tag: "markdown", content: "⏳ Thinking...", element_id: "content" }],
            },
        };
        const createRes = await fetch(`${apiBase}/cardkit/v1/cards`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ type: "card_json", data: JSON.stringify(cardJson) }),
        });
        const createData = (await createRes.json());
        if (createData.code !== 0 || !createData.data?.card_id) {
            throw new Error(`Create card failed: ${createData.msg}`);
        }
        const cardId = createData.data.card_id;
        const sendRes = await this.client.im.message.create({
            params: { receive_id_type: receiveIdType },
            data: {
                receive_id: receiveId,
                msg_type: "interactive",
                content: JSON.stringify({ type: "card", data: { card_id: cardId } }),
            },
        });
        if (sendRes.code !== 0 || !sendRes.data?.message_id) {
            throw new Error(`Send card failed: ${sendRes.msg}`);
        }
        this.state = { cardId, messageId: sendRes.data.message_id, sequence: 1, currentText: "" };
        this.log?.(`Started streaming: cardId=${cardId}, messageId=${sendRes.data.message_id}`);
    }
    async updateCardContent(text, onError) {
        if (!this.state)
            return;
        const apiBase = resolveApiBase(this.creds.domain);
        this.state.sequence += 1;
        await fetch(`${apiBase}/cardkit/v1/cards/${this.state.cardId}/elements/content/content`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: text,
                sequence: this.state.sequence,
                uuid: `s_${this.state.cardId}_${this.state.sequence}`,
            }),
        }).catch((error) => onError?.(error));
    }
    async update(text) {
        if (!this.state || this.closed)
            return;
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottleMs) {
            this.pendingText = text;
            return;
        }
        this.pendingText = null;
        this.lastUpdateTime = now;
        this.queue = this.queue.then(async () => {
            if (!this.state || this.closed)
                return;
            this.state.currentText = text;
            await this.updateCardContent(text, (e) => this.log?.(`Update failed: ${String(e)}`));
        });
        await this.queue;
    }
    async close(finalText) {
        if (!this.state || this.closed)
            return;
        this.closed = true;
        await this.queue;
        const text = finalText ?? this.pendingText ?? this.state.currentText;
        const apiBase = resolveApiBase(this.creds.domain);
        if (text && text !== this.state.currentText) {
            await this.updateCardContent(text);
            this.state.currentText = text;
        }
        this.state.sequence += 1;
        await fetch(`${apiBase}/cardkit/v1/cards/${this.state.cardId}/settings`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                settings: JSON.stringify({
                    config: { streaming_mode: false, summary: { content: truncateSummary(text) } },
                }),
                sequence: this.state.sequence,
                uuid: `c_${this.state.cardId}_${this.state.sequence}`,
            }),
        }).catch((e) => this.log?.(`Close failed: ${String(e)}`));
        this.log?.(`Closed streaming: cardId=${this.state.cardId}`);
    }
    async closeWithFormattedCard(params) {
        if (!this.state || this.closed)
            return;
        this.closed = true;
        await this.queue;
        // Flush any pending text first
        const { answer } = params;
        if (answer && answer !== this.state.currentText) {
            await this.updateCardContent(answer);
            this.state.currentText = answer;
        }
        // Stop streaming mode
        const apiBase = resolveApiBase(this.creds.domain);
        this.state.sequence += 1;
        await fetch(`${apiBase}/cardkit/v1/cards/${this.state.cardId}/settings`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                settings: JSON.stringify({
                    config: { streaming_mode: false, summary: { content: truncateSummary(answer) } },
                }),
                sequence: this.state.sequence,
                uuid: `c_${this.state.cardId}_${this.state.sequence}`,
            }),
        }).catch((e) => this.log?.(`Close streaming failed: ${String(e)}`));
        // Replace card with formatted version (header + answer + tool summary + duration)
        try {
            const card = buildFormattedCard(params);
            await updateCardFeishu({ client: this.client, messageId: this.state.messageId, card });
        }
        catch (e) {
            this.log?.(`Failed to update formatted card, keeping streaming close state: ${String(e)}`);
        }
        this.log?.(`Closed with formatted card: cardId=${this.state.cardId}`);
    }
    /** Close streaming and replace card with a summary-only card (no answer text, just tool calls + duration) */
    async closeWithSummaryCard(params) {
        if (!this.state || this.closed)
            return;
        this.closed = true;
        await this.queue;
        // Stop streaming mode
        const apiBase = resolveApiBase(this.creds.domain);
        this.state.sequence += 1;
        await fetch(`${apiBase}/cardkit/v1/cards/${this.state.cardId}/settings`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                settings: JSON.stringify({
                    config: { streaming_mode: false, summary: { content: "✅ Complete" } },
                }),
                sequence: this.state.sequence,
                uuid: `c_${this.state.cardId}_${this.state.sequence}`,
            }),
        }).catch((e) => this.log?.(`Close streaming failed: ${String(e)}`));
        // Replace card with summary-only (no answer body — answer will be sent as post message)
        try {
            const card = buildSummaryCard(params);
            await updateCardFeishu({ client: this.client, messageId: this.state.messageId, card });
        }
        catch (e) {
            this.log?.(`Failed to update summary card: ${String(e)}`);
        }
        this.log?.(`Closed with summary card: cardId=${this.state.cardId}`);
    }
    /** Delete the streaming card message entirely */
    async deleteMessage() {
        if (!this.state)
            return;
        this.closed = true;
        await this.queue;
        // Stop streaming mode first
        const apiBase = resolveApiBase(this.creds.domain);
        this.state.sequence += 1;
        await fetch(`${apiBase}/cardkit/v1/cards/${this.state.cardId}/settings`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${await getToken(this.creds)}`,
                "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
                settings: JSON.stringify({ config: { streaming_mode: false } }),
                sequence: this.state.sequence,
                uuid: `c_${this.state.cardId}_${this.state.sequence}`,
            }),
        }).catch(() => { });
        // Delete the message
        try {
            await this.client.im.message.delete({ path: { message_id: this.state.messageId } });
            this.log?.(`Deleted streaming card message: ${this.state.messageId}`);
        }
        catch (e) {
            this.log?.(`Failed to delete streaming card: ${String(e)}`);
        }
    }
    isActive() {
        return this.state !== null && !this.closed;
    }
}
//# sourceMappingURL=streaming-card.js.map