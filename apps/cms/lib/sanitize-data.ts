/**
 * Sanitize data to remove unusual line terminators that Convex cannot handle
 * Removes Line Separator (U+2028) and Paragraph Separator (U+2029)
 * and replaces them with standard newlines
 */
export function sanitizeData(data: any): any {
	if (typeof data === "string") {
		// Remove Line Separator (U+2028) and Paragraph Separator (U+2029)
		return data.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")
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
