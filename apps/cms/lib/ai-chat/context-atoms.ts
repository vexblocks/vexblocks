"use client";

import type { UIMessage } from "@ai-sdk/react";
import { atom } from "@lfades/atom";

// ================================
// TYPES
// ================================

export type ChatSession = {
	id: string;
	title?: string;
	createdAt: number;
	updatedAt: number;
};

export type RecentOperation = {
	id: string;
	type: "schema" | "content";
	action: "create" | "update" | "list" | "get";
	target: string;
	timestamp: number;
	success: boolean;
};

export type ChatContextState = {
	currentChatId: string | null;
	messages: UIMessage[];
	isLoading: boolean;
	recentOperations: RecentOperation[];
	cachedSchemaIds: string[];
};

// ================================
// ATOMS
// ================================

/**
 * Current chat session ID
 */
export const currentChatIdAtom = atom<string | null>(null);

/**
 * Chat messages for the current session
 */
export const messagesAtom = atom<UIMessage[]>([]);

/**
 * Loading state for AI responses
 */
export const isLoadingAtom = atom<boolean>(false);

/**
 * Recent operations performed by the AI agent
 * Used to provide context and avoid redundant operations
 */
export const recentOperationsAtom = atom<RecentOperation[]>([]);

/**
 * List of schema IDs that have been accessed in this session
 * Used for context-aware suggestions
 */
export const cachedSchemaIdsAtom = atom<string[]>([]);

/**
 * Chat sessions list
 */
export const chatSessionsAtom = atom<ChatSession[]>([]);

/**
 * Error state for chat operations
 */
export const chatErrorAtom = atom<string | null>(null);

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Add a recent operation to the context
 */
export function addRecentOperation(
	operation: Omit<RecentOperation, "id" | "timestamp">,
): void {
	const newOperation: RecentOperation = {
		...operation,
		id: crypto.randomUUID(),
		timestamp: Date.now(),
	};

	const current = recentOperationsAtom.get();
	// Keep only last 20 operations
	const updated = [newOperation, ...current].slice(0, 20);
	recentOperationsAtom.set(updated);
}

/**
 * Add a schema ID to the cached list
 */
export function addCachedSchemaId(schemaId: string): void {
	const current = cachedSchemaIdsAtom.get();
	if (!current.includes(schemaId)) {
		cachedSchemaIdsAtom.set([...current, schemaId]);
	}
}

/**
 * Clear the current chat context
 */
export function clearChatContext(): void {
	currentChatIdAtom.set(null);
	messagesAtom.set([]);
	recentOperationsAtom.set([]);
	cachedSchemaIdsAtom.set([]);
	chatErrorAtom.set(null);
}

/**
 * Set chat error
 */
export function setChatError(error: string | null): void {
	chatErrorAtom.set(error);
}

/**
 * Get context summary for AI prompts
 */
export function getContextSummary(): string {
	const operations = recentOperationsAtom.get();
	const schemaIds = cachedSchemaIdsAtom.get();

	if (operations.length === 0 && schemaIds.length === 0) {
		return "";
	}

	let summary = "\n\n## Session Context\n";

	if (schemaIds.length > 0) {
		summary += `\nSchemas accessed this session: ${schemaIds.length}\n`;
	}

	if (operations.length > 0) {
		const recentOps = operations.slice(0, 5);
		summary += "\nRecent operations:\n";
		for (const op of recentOps) {
			const status = op.success ? "✓" : "✗";
			summary += `- ${status} ${op.action} ${op.type}: ${op.target}\n`;
		}
	}

	return summary;
}
