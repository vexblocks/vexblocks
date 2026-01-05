"use client"

import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexProvider, ConvexReactClient } from "convex/react"
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

export const ConvexProviderComponent = ({ children }: PropsWithChildren) => (
	<ConvexProvider client={convex}>
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	</ConvexProvider>
)
