/**
 * Hook to trigger type generation after schema changes
 * This runs on the client side and calls the local API endpoint
 */
export async function triggerTypeGeneration(): Promise<void> {
	if (process.env.NODE_ENV !== "development") {
		return
	}

	try {
		console.log("🔄 Triggering type generation...")

		const response = await fetch("/api/generate-types", {
			method: "POST",
		})

		if (!response.ok) {
			const error = await response.json()
			console.error("❌ Type generation failed:", error)
			return
		}

		const result = await response.json()
		console.log("✅ Type generation completed:", result.message)
	} catch (error) {
		// Don't throw - we don't want to break the UI if type generation fails
		console.error(
			"❌ Error triggering type generation:",
			error instanceof Error ? error.message : "Unknown error",
		)
	}
}
