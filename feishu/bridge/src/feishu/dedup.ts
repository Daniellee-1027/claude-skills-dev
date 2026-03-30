/**
 * Simple in-memory message deduplication.
 * Replaces OpenClaw's createDedupeCache + createPersistentDedupe.
 */

const DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_SIZE = 2000;

const cache = new Map<string, number>();

export function tryRecordMessage(messageId: string): boolean {
  const now = Date.now();

  // Prune expired entries periodically
  if (cache.size > MAX_SIZE) {
    for (const [key, ts] of cache) {
      if (now - ts > DEDUP_TTL_MS) {
        cache.delete(key);
      }
    }
  }

  if (cache.has(messageId)) {
    return false; // duplicate
  }

  cache.set(messageId, now);
  return true; // new message
}
