import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

const signInRoutes = ["/login"]

export default async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request)
	const isSignInRoute = signInRoutes.includes(request.nextUrl.pathname)

	// If trying to access a sign-in route and not logged in, allow access
	if (isSignInRoute && !sessionCookie) {
		return NextResponse.next()
	}

	// If trying to access a protected route (not sign-in) and not logged in, redirect to login
	if (!isSignInRoute && !sessionCookie) {
		return NextResponse.redirect(new URL("/login", request.url))
	}

	// If logged in and trying to access sign-in route, redirect to dashboard (root)
	if (isSignInRoute) {
		return NextResponse.redirect(new URL("/", request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
}
