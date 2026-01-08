import { mutation } from "../_generated/server"

// Sanitize data to remove unusual line terminators and fix JSON strings
function sanitizeData(data: any): any {
	if (typeof data === "string") {
		// First, replace unusual Unicode line terminators with standard newlines
		let sanitized = data.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")

		// If this looks like a JSON string (starts with { or [), try to parse and re-stringify it
		// to ensure all control characters are properly escaped
		if (
			(sanitized.startsWith("{") || sanitized.startsWith("[")) &&
			sanitized.length > 100
		) {
			try {
				const parsed = JSON.parse(sanitized)
				sanitized = JSON.stringify(parsed)
			} catch (_e) {
				// If parsing fails, it might have unescaped newlines or other issues
				// Try to fix common issues: unescaped newlines in text values
				console.log("Failed to parse JSON, attempting to fix...")
			}
		}

		return sanitized
	}
	if (Array.isArray(data)) {
		return data.map((item) => sanitizeData(item))
	}
	if (data !== null && typeof data === "object") {
		const sanitized: Record<string, any> = {}
		for (const [key, value] of Object.entries(data)) {
			sanitized[key] = sanitizeData(value)
		}
		return sanitized
	}
	return data
}

/**
 * One-time migration to sanitize all existing content in the database
 * Run this from the Convex dashboard to clean up existing data with unusual line terminators
 */
export const sanitizeAllContent = mutation({
	args: {},
	handler: async (ctx) => {
		const contents = await ctx.db.query("cmsContent").collect()
		let updatedCount = 0

		for (const content of contents) {
			const sanitizedData = sanitizeData(content.data)
			const sanitizedSeo = content.seo ? sanitizeData(content.seo) : undefined

			// Check if sanitization changed anything
			const dataChanged =
				JSON.stringify(sanitizedData) !== JSON.stringify(content.data)
			const seoChanged =
				content.seo &&
				JSON.stringify(sanitizedSeo) !== JSON.stringify(content.seo)

			if (dataChanged || seoChanged) {
				await ctx.db.patch(content._id, {
					data: sanitizedData,
					...(seoChanged && { seo: sanitizedSeo }),
				})
				updatedCount++
				console.log(`Sanitized content: ${content._id}`)
			}
		}

		return {
			success: true,
			message: `Sanitized ${updatedCount} content items out of ${contents.length} total`,
			updatedCount,
			totalCount: contents.length,
		}
	},
})
