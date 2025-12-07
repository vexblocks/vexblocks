import {
	type FunctionReference,
	type FunctionReturnType,
	getFunctionName,
} from "convex/server"
import { unstable_cache } from "next/cache"

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!

type CachedQueryOptions = {
	/**
	 * Time in seconds before the cache is revalidated
	 * @default 86400 (24 hours)
	 */
	revalidate?: number
	/**
	 * Cache tags for manual revalidation
	 * @default ["cms"]
	 */
	tags?: string[]
	/**
	 * Skip cache entirely and fetch fresh data
	 * Useful for preview mode
	 * @default false
	 */
	skipCache?: boolean
}

/**
 * Cached version of Convex fetchQuery for static generation (SSG/ISR)
 *
 * Usage (same as fetchQuery):
 * ```ts
 * const data = await cachedQuery(api.cms.schemas.getIdByName, { name: "blog" })
 * ```
 *
 * For preview mode, skip the cache:
 * ```ts
 * const data = await cachedQuery(
 *   api.cms.content.getBySlug,
 *   { slug },
 *   { skipCache: isPreview }
 * )
 * ```
 *
 * @see https://docs.convex.dev/client/nextjs/app-router/server-rendering
 */
export async function cachedQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args: Query["_args"] = {} as Query["_args"],
	options: CachedQueryOptions = {},
): Promise<FunctionReturnType<Query>> {
	const functionName = getFunctionName(query)

	// Direct fetch function (used both with and without cache)
	const fetchData = async (): Promise<unknown> => {
		const response = await fetch(`${CONVEX_URL}/api/query`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				path: functionName,
				args: formatArgs(args),
			}),
			// For skipCache mode, ensure no HTTP caching
			...(options.skipCache && { cache: "no-store" as const }),
		})

		if (!response.ok) {
			throw new Error(`Convex query failed: ${response.statusText}`)
		}

		const result = await response.json()
		if (result.status === "error") {
			throw new Error(result.errorMessage || "Convex query error")
		}

		return parseValue(result.value)
	}

	// If skipCache is true (preview mode), fetch directly without caching
	if (options.skipCache) {
		return fetchData() as Promise<FunctionReturnType<Query>>
	}

	// Otherwise, use Next.js cache
	const cacheKey = `convex:${functionName}:${JSON.stringify(args)}`
	const cached = unstable_cache(fetchData, [cacheKey], {
		revalidate: options.revalidate ?? 86400,
		tags: options.tags ?? ["cms"],
	})

	return cached() as Promise<FunctionReturnType<Query>>
}

// Format args for Convex JSON format
function formatArgs(args: Record<string, unknown>): Record<string, unknown> {
	const formatted: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(args)) {
		// Skip undefined values - Convex expects them to be omitted, not null
		if (value === undefined) continue
		formatted[key] = formatValue(value)
	}
	return formatted
}

function formatValue(value: unknown): unknown {
	if (value === null || value === undefined) return null
	if (typeof value === "bigint") return { $integer: value.toString() }
	if (Array.isArray(value)) return value.map(formatValue)
	if (typeof value === "object") {
		const formatted: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			formatted[k] = formatValue(v)
		}
		return formatted
	}
	return value
}

function parseValue(value: unknown): unknown {
	if (value === null || value === undefined) return value
	if (
		typeof value === "object" &&
		"$integer" in (value as Record<string, unknown>)
	) {
		return BigInt((value as { $integer: string }).$integer)
	}
	if (Array.isArray(value)) return value.map(parseValue)
	if (typeof value === "object") {
		const parsed: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			parsed[k] = parseValue(v)
		}
		return parsed
	}
	return value
}
