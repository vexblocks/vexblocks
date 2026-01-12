import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server";

// ================================
// RETRY LOGIC
// ================================

type RetryOptions = {
	maxRetries?: number;
	retryDelay?: number;
	backoffMultiplier?: number;
};

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	retryDelay: 500,
	backoffMultiplier: 2,
};

/**
 * Execute an async operation with exponential backoff retry logic
 */
export async function withRetries<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const { maxRetries, retryDelay, backoffMultiplier } = {
		...DEFAULT_RETRY_OPTIONS,
		...options,
	};

	let lastError: Error | undefined;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry on the last attempt
			if (attempt < maxRetries - 1) {
				const delay = retryDelay * backoffMultiplier ** attempt;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError;
}

// ================================
// CONVEX QUERY HELPERS
// ================================

/**
 * Fetch a query with automatic retry logic
 */
export async function fetchQueryWithRetry<T>(
	queryFn: Parameters<typeof fetchAuthQuery>[0],
	args: Parameters<typeof fetchAuthQuery>[1],
	options?: RetryOptions,
): Promise<T> {
	return withRetries(
		() => fetchAuthQuery(queryFn, args) as Promise<T>,
		options,
	);
}

/**
 * Fetch a mutation with automatic retry logic
 */
export async function fetchMutationWithRetry<T>(
	mutationFn: Parameters<typeof fetchAuthMutation>[0],
	args: Parameters<typeof fetchAuthMutation>[1],
	options?: RetryOptions,
): Promise<T> {
	return withRetries(
		() => fetchAuthMutation(mutationFn, args) as Promise<T>,
		options,
	);
}

// ================================
// SCHEMA CACHE
// ================================

type CMSSchema = {
	_id: string;
	name: string;
	displayName: string;
	type: "global" | "page" | "collection";
	description?: string;
	fields: CMSField[];
	icon?: string;
	createdBy: string;
	updatedAt: number;
};

type CMSField = {
	name: string;
	type: string;
	label?: string;
	required?: boolean;
	[key: string]: unknown;
};

type CachedSchema = {
	data: CMSSchema;
	timestamp: number;
};

type CachedSchemaList = {
	data: CMSSchema[];
	timestamp: number;
};

const schemaCache = new Map<string, CachedSchema>();
const schemaListCache: { value: CachedSchemaList | null } = { value: null };
const SCHEMA_CACHE_TTL = 60_000; // 1 minute

/**
 * Get a schema with caching
 */
export async function getCachedSchema(
	schemaId: string,
): Promise<CMSSchema | null> {
	const cached = schemaCache.get(schemaId);
	const now = Date.now();

	if (cached && now - cached.timestamp < SCHEMA_CACHE_TTL) {
		return cached.data;
	}

	const schema = await fetchQueryWithRetry<CMSSchema | null>(
		api.cms.schemas.get,
		{
			id: schemaId as Id<"cmsSchemas">,
		},
	);

	if (schema) {
		schemaCache.set(schemaId, { data: schema, timestamp: now });
	}

	return schema;
}

/**
 * Get all schemas with caching
 */
export async function getCachedSchemas(): Promise<CMSSchema[]> {
	const now = Date.now();

	if (
		schemaListCache.value &&
		now - schemaListCache.value.timestamp < SCHEMA_CACHE_TTL
	) {
		return schemaListCache.value.data;
	}

	const schemas = await fetchQueryWithRetry<CMSSchema[] | null>(
		api.cms.schemas.list,
		{},
	);

	if (schemas) {
		schemaListCache.value = { data: schemas, timestamp: now };
		// Also cache individual schemas
		for (const schema of schemas) {
			schemaCache.set(schema._id, { data: schema, timestamp: now });
		}
	}

	return schemas ?? [];
}

/**
 * Invalidate schema cache
 */
export function invalidateSchemaCache(schemaId?: string): void {
	if (schemaId) {
		schemaCache.delete(schemaId);
		schemaListCache.value = null;
	} else {
		schemaCache.clear();
		schemaListCache.value = null;
	}
}

// ================================
// BATCH OPERATIONS
// ================================

type BatchQueryItem = {
	queryFn: Parameters<typeof fetchAuthQuery>[0];
	args: Parameters<typeof fetchAuthQuery>[1];
};

/**
 * Execute multiple queries in parallel
 */
export async function batchQueries(
	queries: BatchQueryItem[],
): Promise<unknown[]> {
	return Promise.all(
		queries.map((q) => fetchQueryWithRetry(q.queryFn, q.args)),
	);
}

// ================================
// LOGGING
// ================================

type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

export const logger = {
	debug: (message: string, data?: unknown) => {
		if (shouldLog("debug")) {
			console.debug(`[AI Chat Debug] ${message}`, data ?? "");
		}
	},

	info: (message: string, data?: unknown) => {
		if (shouldLog("info")) {
			console.log(`[AI Chat] ${message}`, data ?? "");
		}
	},

	warn: (message: string, data?: unknown) => {
		if (shouldLog("warn")) {
			console.warn(`[AI Chat Warning] ${message}`, data ?? "");
		}
	},

	error: (message: string, error?: unknown) => {
		if (shouldLog("error")) {
			console.error(`[AI Chat Error] ${message}`, error ?? "");
		}
	},

	tool: (toolName: string, args: unknown, result: unknown) => {
		if (shouldLog("debug")) {
			console.debug(`[AI Chat Tool] ${toolName}`, { args, result });
		}
	},
};
