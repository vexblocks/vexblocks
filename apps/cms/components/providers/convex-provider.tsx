"use client"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import type { PropsWithChildren } from "react"
import { authClient } from "@repo/backend/better-auth/client"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
	console.error("❌ NEXT_PUBLIC_CONVEX_URL is not set!")
}

const convex = new ConvexReactClient(convexUrl as string, {
	// Don't pause queries globally - let components handle their own loading states
	// This prevents the flickering issue with auth checks
	verbose: process.env.NODE_ENV === "development",
})

const convexQueryClient = new ConvexQueryClient(convex)

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
			// Reduce refetch on window focus to prevent unnecessary auth checks
			refetchOnWindowFocus: false,
			// Keep data fresh for 5 minutes - this prevents loading spinners on navigation
			staleTime: 1000 * 60 * 5, // 5 minutes
			// Keep cached data for 10 minutes after last use
			gcTime: 1000 * 60 * 10, // 10 minutes
		},
	},
})
convexQueryClient.connect(queryClient)

export const ConvexProvider = ({
	children,
	initialToken,
}: PropsWithChildren<{ initialToken: string | null }>) => (
	<ConvexBetterAuthProvider
		client={convex}
		authClient={authClient}
		initialToken={initialToken}
	>
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	</ConvexBetterAuthProvider>
)
