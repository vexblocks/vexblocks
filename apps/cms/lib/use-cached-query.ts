import { convexQuery } from "@convex-dev/react-query"
import { useAtom } from "@lfades/atom"
import {
	keepPreviousData,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query"
import type { FunctionReference, FunctionReturnType } from "convex/server"
import { authAtom } from "./auth-atom"

type ConvexQueryArgs<T extends FunctionReference<"query">> =
	T extends FunctionReference<"query", "public", infer Args> ? Args : never

type UseCachedQueryOptions = {
	// If true, will skip the query when not authenticated (default: true)
	requireAuth?: boolean
	// Keep previous data while fetching new data (default: true)
	keepPrevious?: boolean
}

/**
 * A wrapper around TanStack Query's useQuery that integrates with Convex
 * and provides better caching behavior for navigation.
 *
 * Benefits:
 * - Shows cached data instantly on navigation (no loading spinners)
 * - Background refetches keep data fresh
 * - Automatic auth state handling
 */
export function useCachedQuery<T extends FunctionReference<"query">>(
	query: T,
	args: ConvexQueryArgs<T> | "skip",
	options: UseCachedQueryOptions = {},
): {
	data: FunctionReturnType<T> | undefined
	isPending: boolean
	isFetching: boolean
	error: Error | null
} {
	const { requireAuth = true, keepPrevious = true } = options
	const [auth] = useAtom(authAtom)
	const isReady = !requireAuth || (auth.isInitialized && auth.user !== null)

	const shouldSkip = args === "skip" || !isReady

	const result = useQuery({
		...convexQuery(query, shouldSkip ? ("skip" as any) : args),
		enabled: !shouldSkip,
		placeholderData: keepPrevious ? keepPreviousData : undefined,
	} as UseQueryOptions)

	return {
		data: result.data as FunctionReturnType<T> | undefined,
		isPending: result.isPending,
		isFetching: result.isFetching,
		error: result.error,
	}
}

/**
 * Same as useCachedQuery but for public queries that don't require auth
 */
export function usePublicCachedQuery<T extends FunctionReference<"query">>(
	query: T,
	args: ConvexQueryArgs<T> | "skip",
): {
	data: FunctionReturnType<T> | undefined
	isPending: boolean
	isFetching: boolean
	error: Error | null
} {
	return useCachedQuery(query, args, { requireAuth: false })
}
