"use client"

import { useAtom } from "@lfades/atom"
import { usePathname } from "next/navigation"
import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"
import { authAtom } from "@/lib/auth-atom"
import { authClient } from "@repo/backend/better-auth/client"

const SESSION_TIMEOUT_MS = 10000 // 10 seconds timeout for loading check
const NO_USER_DELAY_MS = 3000 // 3 seconds delay before showing expired session UI

// Pages that should be excluded from session recovery check
const EXCLUDED_PATHS = ["/login", "/api"]

/**
 * SessionRecovery - Detects and recovers from corrupted/expired sessions
 *
 * This component:
 * 1. Detects when the app is stuck loading (auth never initializes)
 * 2. Detects when auth initializes but there's no user (expired session)
 * 3. Provides a manual "Clear Session" button
 * 4. Excludes login and API pages from the check
 * 5. Cancels automatically when auth initializes with a valid user
 */
export function SessionRecovery({ children }: PropsWithChildren) {
	const pathname = usePathname()
	const [authState] = useAtom(authAtom)
	const [isStuck, setIsStuck] = useState(false)
	const [stuckReason, setStuckReason] = useState<"timeout" | "no-user">(
		"timeout",
	)
	const [isClearing, setIsClearing] = useState(false)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const noUserTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Check if current path should be excluded
	const isExcludedPath = EXCLUDED_PATHS.some((path) =>
		pathname?.startsWith(path),
	)

	// Clear all timeouts helper
	const clearAllTimeouts = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
		if (noUserTimeoutRef.current) {
			clearTimeout(noUserTimeoutRef.current)
			noUserTimeoutRef.current = null
		}
	}, [])

	// Cancel timeouts and reset state when user is authenticated
	useEffect(() => {
		if (authState.isInitialized && authState.user) {
			clearAllTimeouts()
			if (isStuck) {
				setIsStuck(false)
			}
		}
	}, [authState.isInitialized, authState.user, isStuck, clearAllTimeouts])

	// Handle: auth initialized but no user (expired/invalid session)
	useEffect(() => {
		if (isExcludedPath || isStuck) {
			return
		}

		// Auth initialized but no user - wait a bit then show recovery UI
		if (authState.isInitialized && !authState.user) {
			noUserTimeoutRef.current = setTimeout(() => {
				// Re-check state after delay
				const currentState = authAtom.get()
				if (currentState.isInitialized && !currentState.user) {
					setStuckReason("no-user")
					setIsStuck(true)
				}
			}, NO_USER_DELAY_MS)

			return () => {
				if (noUserTimeoutRef.current) {
					clearTimeout(noUserTimeoutRef.current)
					noUserTimeoutRef.current = null
				}
			}
		}
	}, [isExcludedPath, authState.isInitialized, authState.user, isStuck])

	// Handle: auth takes too long to initialize
	useEffect(() => {
		if (isExcludedPath || isStuck) {
			return
		}

		// Already initialized, no need for timeout
		if (authState.isInitialized) {
			return
		}

		// Start timeout for loading state
		timeoutRef.current = setTimeout(() => {
			const currentState = authAtom.get()
			if (!currentState.isInitialized) {
				setStuckReason("timeout")
				setIsStuck(true)
			}
		}, SESSION_TIMEOUT_MS)

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [isExcludedPath, authState.isInitialized, isStuck])

	const clearSession = async () => {
		setIsClearing(true)

		try {
			// Clear HttpOnly cookies via server-side API
			await fetch("/api/clear-session", {
				method: "POST",
				credentials: "include",
			})
		} catch (e) {
			console.warn("Error clearing session via API:", e)
		}

		try {
			await fetch("/api/auth/sign-out", {
				method: "POST",
				credentials: "include",
			})
		} catch (e) {
			console.warn("Error signing out via API:", e)
		}

		try {
			// Also try the client signOut
			await authClient.signOut()
		} catch (e) {
			console.warn("Error signing out via client:", e)
		}

		// Clear all client-side storage
		try {
			localStorage.clear()
			sessionStorage.clear()
		} catch (e) {
			console.warn("Error clearing storage:", e)
		}

		// Force hard reload to clear any cached state
		window.location.replace("/login")
	}

	// Show the stuck UI
	if (isStuck && !isClearing) {
		const isExpired = stuckReason === "no-user"

		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-grey-100">
				<div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
					<div className="mb-4 text-center">
						<span className="text-4xl">{isExpired ? "🔐" : "⚠️"}</span>
					</div>
					<h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
						{isExpired ? "Session Expired" : "Session Issue Detected"}
					</h2>
					<p className="mb-6 text-center text-sm text-gray-600">
						{isExpired
							? "Your session has expired or is invalid. Please sign in again to continue."
							: "The app is taking too long to load. This might be caused by a corrupted session."}
					</p>
					<div className="flex flex-col gap-3">
						<button
							type="button"
							onClick={clearSession}
							className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-800"
						>
							{isExpired ? "Sign In Again" : "Clear Session & Reload"}
						</button>
						{!isExpired && (
							<button
								type="button"
								onClick={() => setIsStuck(false)}
								className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								Wait a bit longer
							</button>
						)}
					</div>
				</div>
			</div>
		)
	}

	// Show clearing state
	if (isClearing) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
				<div className="text-center">
					<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
					<p className="text-gray-600">Clearing session...</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
