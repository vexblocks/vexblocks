import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
	const cookieStore = await cookies()

	// List of auth-related cookies to clear
	const cookiesToClear = [
		"better-auth.session_token",
		"better-auth.session",
		"__session",
		"session",
		"auth",
	]

	// Clear each cookie
	for (const name of cookiesToClear) {
		cookieStore.delete(name)
	}

	// Also try to get all cookies and clear any that look auth-related
	const allCookies = cookieStore.getAll()
	for (const cookie of allCookies) {
		if (
			cookie.name.includes("auth") ||
			cookie.name.includes("session") ||
			cookie.name.includes("token")
		) {
			cookieStore.delete(cookie.name)
		}
	}

	return NextResponse.json({ success: true })
}
