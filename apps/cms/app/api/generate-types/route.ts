import { exec } from "node:child_process"
import path from "node:path"
import { promisify } from "node:util"
import { NextResponse } from "next/server"

const execAsync = promisify(exec)

/**
 * API route to trigger CMS type generation
 * This endpoint is called from the admin frontend when schemas change
 *
 * This is an internal API - it's only accessible from the same origin
 * and only useful in development mode
 *
 * POST /api/generate-types
 */
export async function POST() {
	try {
		// Get the workspace root (go up from apps/admin to root)
		const workspaceRoot = path.resolve(process.cwd(), "../..")
		const typeGeneratorPath = path.join(
			workspaceRoot,
			"packages/type-generator",
		)

		console.log("🔄 Triggering type generation...")
		console.log(`📍 Type generator path: ${typeGeneratorPath}`)

		// Run the type generator
		const { stdout, stderr } = await execAsync("pnpm generate", {
			cwd: typeGeneratorPath,
			env: {
				...process.env,
				// Ensure we use the same Convex URL
				CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
			},
		})

		if (stderr && !stderr.includes("warning")) {
			console.error("Type generation stderr:", stderr)
		}

		console.log("✅ Type generation completed")
		console.log("Type generation stdout:", stdout)

		return NextResponse.json({
			success: true,
			message: "Types generated successfully",
			output: stdout,
			timestamp: Date.now(),
		})
	} catch (error) {
		console.error("❌ Error generating types:", error)

		return NextResponse.json(
			{
				error: "Failed to generate types",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		)
	}
}
