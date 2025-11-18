/**
 * Extract a clean, user-friendly error message from a Convex error.
 * Removes technical metadata like "Uncaught ConvexError:", stack traces, and request IDs.
 *
 * @param error - The error object (typically from a Convex mutation/query)
 * @param fallbackMessage - Default message to show if extraction fails
 * @returns A clean, user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await createContent({ ... })
 * } catch (err) {
 *   setError(getCleanErrorMessage(err, "Failed to create content"))
 * }
 * ```
 */
export function getCleanErrorMessage(
	error: unknown,
	fallbackMessage = "An error occurred",
): string {
	if (!(error instanceof Error)) {
		return fallbackMessage
	}

	// ConvexError format: "Uncaught ConvexError: actual message at handler (...)"
	// We want to extract just "actual message"
	const convexErrorMatch = error.message.match(
		/ConvexError:\s*(.+?)(?:\s+at\s+|$)/i,
	)
	if (convexErrorMatch) {
		return convexErrorMatch[1].trim()
	}

	// Remove "[CONVEX M(module/function)] [Request ID: ...] Server Error" prefix
	const serverErrorMatch = error.message.match(
		/\[CONVEX.*?\].*?Server Error\s+(.+?)(?:\s+at\s+|$)/i,
	)
	if (serverErrorMatch) {
		return serverErrorMatch[1].trim()
	}

	// Fallback to original message if no pattern matches
	return error.message || fallbackMessage
}
