import { convexQuery } from "@convex-dev/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { api } from "@repo/backend/convex/_generated/api"

/**
 * Map of routes to their required queries for prefetching
 */
const ROUTE_QUERIES: Record<string, Array<{ query: any; args: any }>> = {
	"/": [{ query: api.cms.schemas.list, args: {} }],
	"/schemas": [{ query: api.cms.schemas.list, args: {} }],
	"/blocks": [{ query: api.cms.blocks.list, args: {} }],
	"/content": [{ query: api.cms.schemas.list, args: {} }],
	"/media": [], // Media queries are in the component
	"/settings": [], // Settings page is static
	"/settings/users": [
		{ query: api.cms.users.list, args: {} },
		{ query: api.cms.users.getStats, args: {} },
	],
	"/settings/appearance": [
		{ query: api.cms.settings.getPublic, args: { key: "appearance" } },
	],
	"/settings/localization": [
		{ query: api.cms.settings.get, args: { key: "localization" } },
	],
	"/settings/preview": [
		{ query: api.cms.settings.get, args: { key: "preview" } },
	],
}

/**
 * Hook that returns a function to prefetch queries for a given route
 */
export function usePrefetchRoute() {
	const queryClient = useQueryClient()

	const prefetch = useCallback(
		(route: string) => {
			const queries = ROUTE_QUERIES[route]
			if (!queries || queries.length === 0) return

			for (const { query, args } of queries) {
				const queryOptions = convexQuery(query, args)
				queryClient.prefetchQuery(queryOptions)
			}
		},
		[queryClient],
	)

	return prefetch
}
