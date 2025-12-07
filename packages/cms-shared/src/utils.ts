/**
 * CMS Shared Utilities
 * Common utility functions for handling CMS content
 */

/**
 * Extracts a string value from potentially localized content.
 * Handles both direct string values and localized objects like { en: "Hello", es: "Hola" }
 *
 * @param value - The value to extract a string from (can be string, number, boolean, or localized object)
 * @returns The extracted string value, or empty string if extraction fails
 *
 * @example
 * // Direct string
 * getStringValue("Hello") // => "Hello"
 *
 * // Localized object
 * getStringValue({ en: "Hello", es: "Hola" }) // => "Hello" (first locale value)
 *
 * // Number or boolean
 * getStringValue(42) // => "42"
 * getStringValue(true) // => "true"
 *
 * // Null/undefined
 * getStringValue(null) // => ""
 */
export function getStringValue(value: unknown): string {
	if (typeof value === "string") return value
	if (typeof value === "number" || typeof value === "boolean")
		return String(value)
	if (value && typeof value === "object" && !Array.isArray(value)) {
		// Handle localized content - use first available locale value
		const firstValue = Object.values(value)[0]
		if (typeof firstValue === "string") return firstValue
	}
	return ""
}

/**
 * Extracts a string value for a specific locale from localized content.
 * Falls back to default locale, then to first available value.
 *
 * @param value - The value to extract (can be string or localized object)
 * @param locale - The preferred locale code (e.g., "en", "es")
 * @param defaultLocale - The fallback locale code
 * @returns The extracted string value for the locale
 *
 * @example
 * getLocalizedStringValue({ en: "Hello", es: "Hola" }, "es") // => "Hola"
 * getLocalizedStringValue({ en: "Hello", es: "Hola" }, "fr", "en") // => "Hello" (fallback)
 */
export function getLocalizedStringValue(
	value: unknown,
	locale: string,
	defaultLocale?: string,
): string {
	if (typeof value === "string") return value
	if (typeof value === "number" || typeof value === "boolean")
		return String(value)
	if (value && typeof value === "object" && !Array.isArray(value)) {
		const localeValue = value as Record<string, unknown>
		// Try requested locale first
		if (typeof localeValue[locale] === "string") {
			return localeValue[locale] as string
		}
		// Fall back to default locale
		if (defaultLocale && typeof localeValue[defaultLocale] === "string") {
			return localeValue[defaultLocale] as string
		}
		// Fall back to first available value
		const firstValue = Object.values(localeValue)[0]
		if (typeof firstValue === "string") return firstValue
	}
	return ""
}

/**
 * Checks if a value is a localized content object (has locale keys like { en: "...", es: "..." })
 *
 * @param value - The value to check
 * @returns True if the value appears to be a localized content object
 */
export function isLocalizedContent(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}
	const entries = Object.entries(value)
	// Check if it looks like locale keys (2-3 character strings) with string values
	return entries.length > 0 && entries.every(
		([key, val]) => key.length >= 2 && key.length <= 5 && typeof val === "string"
	)
}

