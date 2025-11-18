"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import { usePathname, useRouter } from "next/navigation"
import { type PropsWithChildren, Suspense, useEffect, useState } from "react"

/**
 * Loading UI component for AuthGuard
 */
function AuthLoadingUI() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-grey-50">
			<div className="text-center">
				<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				<p className="text-grey-500">Loading...</p>
			</div>
		</div>
	)
}

/**
 * AuthGuardContent - The actual authentication logic
 * Wrapped in Suspense by AuthGuard parent component
 */
function AuthGuardContent({ children }: PropsWithChildren) {
	const router = useRouter()
	const pathname = usePathname()
	const currentUser = useQuery(api.auth.getCurrentUser)
	const [isRedirecting, setIsRedirecting] = useState(false)

	useEffect(() => {
		// Only redirect when we're certain the user is not authenticated
		if (currentUser === null) {
			setIsRedirecting(true)
			// Encode the current pathname to redirect back after login
			const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`
			router.push(redirectUrl)
		}
		// Redirect to login if not admin
		else if (currentUser && currentUser.role !== "admin") {
			setIsRedirecting(true)
			router.push("/login?error=unauthorized")
		}
	}, [currentUser, router, pathname])

	// Show loading state while checking authentication OR while redirecting
	// This prevents the flash of content before redirect
	if (currentUser === undefined || isRedirecting) {
		return <AuthLoadingUI />
	}

	// Don't render children if not authenticated or not admin
	if (!currentUser || currentUser.role !== "admin") {
		return <AuthLoadingUI />
	}

	// User is authenticated and is admin, render the children
	return <>{children}</>
}

/**
 * AuthGuard - Main export that wraps AuthGuardContent in Suspense
 *
 * This component prevents the flash of login page by:
 * 1. Showing a loading state while verifying authentication
 * 2. Preserving the current URL for redirect after login
 * 3. Only redirecting when we're certain the user is not authenticated
 * 4. Using Suspense to prevent blocking route errors with Cache Components
 * 5. Maintaining loading state during redirects to prevent content flashing
 */
export function AuthGuard({ children }: PropsWithChildren) {
	return (
		<Suspense fallback={<AuthLoadingUI />}>
			<AuthGuardContent>{children}</AuthGuardContent>
		</Suspense>
	)
}
