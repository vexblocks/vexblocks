import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	try {
		// Verify secret token
		const authHeader = request.headers.get("authorization")
		const secret = process.env.REVALIDATE_SECRET

		if (!secret) {
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			)
		}

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Missing authorization" },
				{ status: 401 },
			)
		}

		const token = authHeader.substring(7)
		if (token !== secret) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 })
		}

		// Get path to revalidate from request body
		const body = await request.json()
		const { path } = body

		if (!path || typeof path !== "string") {
			return NextResponse.json(
				{ error: "Missing or invalid path parameter" },
				{ status: 400 },
			)
		}

		// Revalidate the path
		revalidatePath(path)

		return NextResponse.json({
			revalidated: true,
			path,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error("Revalidation error:", error)
		return NextResponse.json(
			{ error: "Failed to revalidate", details: String(error) },
			{ status: 500 },
		)
	}
}
