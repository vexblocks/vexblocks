import type { Field } from "./types"

// Helper to get nested value from contentData
export function getNestedValue(obj: any, path: string): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)
	let current = obj
	for (const key of keys) {
		if (current === undefined || current === null) return undefined
		current = current[key]
	}
	return current
}

// Helper to set nested value in contentData (with deep cloning for arrays)
export function setNestedValue(obj: any, path: string, value: any): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)

	// Deep clone using JSON (more reliable for nested structures)
	const newObj = JSON.parse(JSON.stringify(obj))
	let current = newObj

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i]
		if (!(key in current)) {
			const nextKey = keys[i + 1]
			current[key] = /^\d+$/.test(nextKey) ? [] : {}
		}
		current = current[key]
	}

	const lastKey = keys[keys.length - 1]
	current[lastKey] = value

	return newObj
}

export function isLocaleKey(key: string): boolean {
	return /^[A-Za-z]{2}$/.test(key) || /^[A-Za-z]{2}-[A-Za-z]{2}$/.test(key)
}

export function isLocaleMap(
	value: any,
	options?: { excludeKeys?: string[]; requireAllKeys?: boolean },
): boolean {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}

	const excludedKeys = new Set(options?.excludeKeys ?? [])
	const keys = Object.keys(value).filter((key) => !excludedKeys.has(key))

	if (keys.length === 0) {
		return false
	}

	return options?.requireAllKeys === false
		? keys.some(isLocaleKey)
		: keys.every(isLocaleKey)
}

export function shouldFieldBeTranslatable(
	field: Field | null | undefined,
	hasLocales: boolean,
): boolean {
	if (!hasLocales || !field) return false

	if (field.type === "map") return false

	if (field.translatable !== undefined) {
		return field.translatable
	}

	const textBasedTypes = new Set([
		"shortText",
		"longText",
		"richText",
		"url",
		"youtubeUrl",
		"slug",
	])

	return textBasedTypes.has(field.type)
}

export function getFieldAtPath(
	fields: Field[] | undefined,
	fieldPath: string,
): Field | null {
	let currentFields = fields ?? []
	let currentField: Field | null = null

	for (const part of fieldPath.split(".")) {
		const cleanPart = part.replace(/\[\d+\]/g, "")
		if (!cleanPart) continue

		currentField =
			currentFields.find((field) => field.name === cleanPart) ?? null
		if (!currentField) {
			return null
		}

		currentFields = currentField.fields ?? []
	}

	return currentField
}

function getFirstNonEmptyLocaleValue(value: Record<string, unknown>) {
	return Object.entries(value)
		.filter(([key]) => isLocaleKey(key))
		.map(([, localeValue]) => localeValue)
		.find(
			(localeValue) =>
				localeValue !== undefined && localeValue !== null && localeValue !== "",
		)
}

export function getEditorLocalizedValue({
	rawValue,
	translatable,
	hasLocales,
	currentLocale,
	defaultLocale,
	fallbackToDefaultLocale = true,
}: {
	rawValue: any
	translatable: boolean
	hasLocales: boolean
	currentLocale: string
	defaultLocale: string
	fallbackToDefaultLocale?: boolean
}) {
	if (!hasLocales) {
		return rawValue
	}

	if (translatable) {
		if (isLocaleMap(rawValue, { excludeKeys: ["url", "newWindow"] })) {
			return (
				rawValue[currentLocale] ??
				(fallbackToDefaultLocale
					? (rawValue[defaultLocale] ?? getFirstNonEmptyLocaleValue(rawValue))
					: undefined) ??
				""
			)
		}

		if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
			return currentLocale === defaultLocale || fallbackToDefaultLocale
				? rawValue
				: ""
		}

		return rawValue ?? ""
	}

	if (isLocaleMap(rawValue)) {
		const localeValue =
			rawValue[currentLocale] ??
			(fallbackToDefaultLocale
				? (rawValue[defaultLocale] ?? getFirstNonEmptyLocaleValue(rawValue))
				: undefined)

		if (localeValue !== undefined) {
			return localeValue
		}
	}

	return rawValue
}

export function mergeLocalizedValue({
	currentValue,
	nextValue,
	currentLocale,
	defaultLocale,
}: {
	currentValue: any
	nextValue: any
	currentLocale: string
	defaultLocale: string
}) {
	if (
		isLocaleMap(currentValue, {
			excludeKeys: ["url", "newWindow"],
			requireAllKeys: false,
		})
	) {
		const localeEntries = Object.fromEntries(
			Object.entries(currentValue).filter(([key]) => isLocaleKey(key)),
		)
		return { ...localeEntries, [currentLocale]: nextValue }
	}

	if (
		currentValue !== undefined &&
		currentValue !== null &&
		currentLocale !== defaultLocale
	) {
		return {
			[defaultLocale]: currentValue,
			[currentLocale]: nextValue,
		}
	}

	return { [currentLocale]: nextValue }
}
