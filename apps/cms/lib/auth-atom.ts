import { atom, useAtom } from "@lfades/atom"
import type { Doc } from "@repo/backend/convex/_generated/dataModel"

export type AuthUser = Doc<"users"> & {
	email: string
	name: string | null
	image: string | null
}

export type AuthState = {
	user: AuthUser | null
	isLoading: boolean
	isInitialized: boolean
}

/**
 * Global atom for authentication state
 * This is the single source of truth for auth across the app
 */
export const authAtom = atom<AuthState>({
	user: null,
	isLoading: true,
	isInitialized: false,
})

/**
 * React hook to use auth state
 * Returns the current auth state (doesn't allow setting)
 */
export const useAuth = () => {
	const [authState] = useAtom(authAtom)
	return authState
}

/**
 * Helper to check if user is authenticated
 */
export const isAuthenticated = () => {
	const { user } = authAtom.get()
	return user !== null
}

/**
 * Helper to check if user is admin
 */
export const isAdmin = () => {
	const { user } = authAtom.get()
	return user?.role === "admin"
}

/**
 * Helper to get current user
 */
export const getCurrentAuthUser = () => {
	return authAtom.get().user
}
