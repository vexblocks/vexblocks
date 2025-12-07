"use client"

import { useEffect, useMemo, useState } from "react"
import { usePreview } from "./preview-context"

type PreviewWrapperProps<T> = {
	/**
	 * The static data fetched on the server
	 */
	data: T
	/**
	 * Path to the data field in the object that should be updated with draft data
	 * If not provided, the entire data object will be replaced
	 * @example "data" - means draftData will be merged into data.data
	 */
	dataPath?: string
	/**
	 * Render function that receives the data (either static or preview)
	 */
	children: (data: T) => React.ReactNode
}

/**
 * PreviewWrapper - Conditionally enables live preview data
 *
 * This component checks if the page is in preview mode (via URL params).
 * - In normal mode: Renders children with static server data (no re-renders)
 * - In preview mode: Merges draft data from CMS with static data reactively
 *
 * This approach allows pages to remain as server components while only
 * becoming dynamic when explicitly in preview mode.
 *
 * @example
 * ```tsx
 * // In your page component - draft data will be merged into post.data
 * export default async function PostPage({ params }) {
 *   const post = await fetchPost(params.slug)
 *
 *   return (
 *     <PreviewWrapper data={post} dataPath="data">
 *       {(data) => <PostContent post={data} />}
 *     </PreviewWrapper>
 *   )
 * }
 * ```
 */
export function PreviewWrapper<T extends Record<string, any>>({
	data,
	dataPath = "data",
	children,
}: PreviewWrapperProps<T>) {
	const { isPreviewMode, draftData } = usePreview()
	const [mounted, setMounted] = useState(false)

	// Handle hydration mismatch
	useEffect(() => {
		setMounted(true)
	}, [])

	// Merge draft data with static data when in preview mode
	const mergedData = useMemo(() => {
		if (!isPreviewMode || !draftData || !mounted) {
			return data
		}

		// If no data or empty draft data, return original
		if (!data || Object.keys(draftData).length === 0) {
			return data
		}

		// If dataPath is provided, merge draft data into that specific path
		if (dataPath && data[dataPath]) {
			return {
				...data,
				[dataPath]: mergeDeep(data[dataPath], draftData),
			} as T
		}

		// Otherwise merge directly
		return mergeDeep(data, draftData) as T
	}, [data, draftData, dataPath, isPreviewMode, mounted])

	return <>{children(mergedData)}</>
}

/**
 * Deep merge two objects, with source values overwriting target values
 */
function mergeDeep(target: any, source: any): any {
	if (source === null || source === undefined) {
		return target
	}

	if (typeof source !== "object" || Array.isArray(source)) {
		return source
	}

	if (typeof target !== "object" || target === null) {
		return source
	}

	const result = { ...target }

	for (const key of Object.keys(source)) {
		const sourceValue = source[key]
		const targetValue = target[key]

		if (
			typeof sourceValue === "object" &&
			sourceValue !== null &&
			!Array.isArray(sourceValue) &&
			typeof targetValue === "object" &&
			targetValue !== null &&
			!Array.isArray(targetValue)
		) {
			result[key] = mergeDeep(targetValue, sourceValue)
		} else if (sourceValue !== undefined) {
			result[key] = sourceValue
		}
	}

	return result
}
