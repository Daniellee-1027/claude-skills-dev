/**
 * Simple in-memory message deduplication.
 * Replaces OpenClaw's createDedupeCache + createPersistentDedupe.
 */
export declare function tryRecordMessage(messageId: string): boolean;
