import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"
import { api } from "@/convex/_generated/api"
import { fetchAuthQuery } from "@/lib/auth-server"
import { canAccessDashboard, type UserRole } from "@/lib/permissions"

const signInRoutes = ["/login"]
const accountDisabledRoute = "/account-disabled"

export default async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request)
	const isSignInRoute = signInRoutes.includes(request.nextUrl.pathname)
	const isAccountDisabledRoute =
		request.nextUrl.pathname === accountDisabledRoute

	// If trying to access a sign-in route and not logged in, allow access
	if (isSignInRoute && !sessionCookie) {
		return NextResponse.next()
	}

	// If trying to access a protected route (not sign-in) and not logged in, redirect to login
	if (!isSignInRoute && !sessionCookie && !isAccountDisabledRoute) {
		return NextResponse.redirect(new URL("/login", request.url))
	}

	// If logged in, validate user role and isActive status
	if (sessionCookie && !isSignInRoute) {
		try {
			const currentUser = await fetchAuthQuery(api.auth.getCurrentUser, {})

			if (!currentUser) {
				return NextResponse.redirect(new URL("/login", request.url))
			}

			// Check if user is active
			if (currentUser.isActive === false && !isAccountDisabledRoute) {
				return NextResponse.redirect(new URL(accountDisabledRoute, request.url))
			}

			// If user is on account-disabled page but is active, redirect to dashboard
			if (isAccountDisabledRoute && currentUser.isActive !== false) {
				return NextResponse.redirect(new URL("/", request.url))
			}

			// Check if user role has access to CMS dashboard
			const userRole = (currentUser.role as UserRole) || "user"
			if (!canAccessDashboard(userRole) && !isAccountDisabledRoute) {
				return NextResponse.redirect(new URL(accountDisabledRoute, request.url))
			}
		} catch (error) {
			console.error("Error validating user permissions:", error)
			return NextResponse.redirect(new URL("/login", request.url))
		}
	}

	// If logged in and trying to access sign-in route, redirect to dashboard (root)
	if (isSignInRoute && sessionCookie) {
		return NextResponse.redirect(new URL("/", request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
}
