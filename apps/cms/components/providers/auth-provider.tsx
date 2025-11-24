"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { type PropsWithChildren, useEffect } from "react"
import { authAtom } from "@/lib/auth-atom"

/**
 * AuthProvider - Initializes and syncs the auth atom with Convex
 *
 * This provider:
 * 1. Subscribes to Convex auth state
 * 2. Updates the global auth atom whenever auth changes
 * 3. Provides a single source of truth for auth across the app
 *
 * Place this high in the component tree, ideally in the root layout
 */
export function AuthProvider({ children }: PropsWithChildren) {
	const currentUser = useQuery(api.auth.getCurrentUser)

	// Sync Convex auth state to the atom
	useEffect(() => {
		if (currentUser === undefined) {
			// Still loading
			authAtom.set({
				user: null,
				isLoading: true,
				isInitialized: false,
			})
		} else if (currentUser === null) {
			// Not authenticated
			authAtom.set({
				user: null,
				isLoading: false,
				isInitialized: true,
			})
		} else {
			// Authenticated - cast to AuthUser type
			authAtom.set({
				user: {
					...currentUser,
					email: currentUser.email,
					name: currentUser.name ?? null,
					image: currentUser.image ?? null,
				},
				isLoading: false,
				isInitialized: true,
			})
		}
	}, [currentUser])

	return <>{children}</>
}
