"use client"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { authClient } from "@repo/backend/better-auth/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import type { PropsWithChildren } from "react"

const convex = new ConvexReactClient(
	process.env.NEXT_PUBLIC_CONVEX_URL as string,
)

const convexQueryClient = new ConvexQueryClient(convex)

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: convexQueryClient.hashFn(),
			queryFn: convexQueryClient.queryFn(),
		},
	},
})
convexQueryClient.connect(queryClient)

export const ConvexProvider = ({ children }: PropsWithChildren) => (
	<ConvexBetterAuthProvider client={convex} authClient={authClient}>
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	</ConvexBetterAuthProvider>
)
