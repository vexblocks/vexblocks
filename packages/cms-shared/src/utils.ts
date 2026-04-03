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
 * Deep-resolves locale-keyed values in a nested CMS data structure.
 * Objects where ALL keys are known locale codes are treated as locale-keyed
 * and resolved to the value for the given locale, with fallbacks.
 * Arrays are recursively processed. Regular objects recurse into their values.
 *
 * @param value - The value to resolve (can be any CMS data structure)
 * @param locale - The preferred locale code (e.g., "en", "de")
 * @param knownLocales - List of locale codes to detect locale-keyed objects
 * @returns The resolved value with all locale objects replaced by their strings
 *
 * @example
 * deepResolveLocale({ en: "Hello", de: "Hallo" }, "de") // => "Hallo"
 * deepResolveLocale({ title: { en: "Hi", de: "Hallo" } }, "en") // => { title: "Hi" }
 */
export function deepResolveLocale(
	value: unknown,
	locale: string,
	knownLocales: readonly string[] = ["en", "de"],
): unknown {
	if (value === null || value === undefined) return value
	if (typeof value !== "object") return value
	if (Array.isArray(value)) {
		return value.map((item) => deepResolveLocale(item, locale, knownLocales))
	}
	const obj = value as Record<string, unknown>
	const keys = Object.keys(obj)
	if (keys.length > 0 && keys.every((k) => knownLocales.includes(k))) {
		// Locale-keyed object — resolve to current locale with fallbacks
		return (
			obj[locale] ??
			obj[knownLocales[0]] ??
			Object.values(obj).find((v) => typeof v === "string" && v) ??
			""
		)
	}
	// Single-key object whose only key is "teext" — CMS schema typo for "text"
	if (keys.length === 1 && keys[0] === "teext") {
		return deepResolveLocale(obj.teext, locale, knownLocales)
	}
	// Regular object — recurse into values
	const result: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(obj)) {
		result[k] = deepResolveLocale(v, locale, knownLocales)
	}
	return result
}

/**
 * Checks if a value is a localized content object (has locale keys like { en: "...", es: "..." })
 *
 * @param value - The value to check
 * @returns True if the value appears to be a localized content object
 */
export function isLocalizedContent(
	value: unknown,
): value is Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}
	const entries = Object.entries(value)
	// Check if it looks like locale keys (2-3 character strings) with string values
	return (
		entries.length > 0 &&
		entries.every(
			([key, val]) =>
				key.length >= 2 && key.length <= 5 && typeof val === "string",
		)
	)
}
