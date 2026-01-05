"use client"

import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
} from "react"
import { usePreview } from "./preview-context"

// ============================================================================
// CMS Content Context
// ============================================================================

type CmsContentContextValue<T = any> = {
	data: T
	isPreview: boolean
}

const CmsContentContext = createContext<CmsContentContextValue | null>(null)

// ============================================================================
// Hook: useCmsContent
// ============================================================================

/**
 * useCmsContent - Access CMS content with automatic live preview
 *
 * This hook returns the content data. In preview mode, it automatically
 * merges draft data from the CMS admin. No wrappers needed!
 *
 * @example
 * ```tsx
 * function PostHeader() {
 *   const post = useCmsContent<Post>()
 *   return <h1>{post.data.title}</h1>
 * }
 * ```
 */
export function useCmsContent<T = any>(): T {
	const context = useContext(CmsContentContext)
	if (!context) {
		throw new Error(
			"useCmsContent must be used within CmsContent. " +
				"Wrap your component tree with <CmsContent initialData={...}>",
		)
	}
	return context.data as T
}

/**
 * useIsPreview - Check if in preview mode
 */
export function useIsPreview(): boolean {
	const context = useContext(CmsContentContext)
	return context?.isPreview ?? false
}

// ============================================================================
// Component: CmsContent
// ============================================================================

type CmsContentProps<T> = {
	/**
	 * Initial data fetched from the server (via cachedQuery)
	 * Can be null if content not found
	 */
	initialData: T | null
	children: ReactNode
}

/**
 * CmsContent - Provides CMS content with automatic live preview
 *
 * Wrap your page content with this component. Child components can use
 * `useCmsContent()` to access the data. In preview mode, draft data
 * from the CMS admin is automatically merged.
 *
 * Similar to Sanity's pattern - developers don't need to add EditableField
 * wrappers or handle preview logic manually.
 *
 * @example
 * ```tsx
 * // page.tsx (Server Component)
 * export default async function PostPage({ params }) {
 *   const post = await cachedQuery(api.cms.content.getBySlug, { slug })
 *
 *   return (
 *     <CmsContent initialData={post}>
 *       <PostHeader />
 *       <PostBody />
 *     </CmsContent>
 *   )
 * }
 *
 * // PostHeader.tsx (can be Server or Client Component)
 * function PostHeader() {
 *   const post = useCmsContent<Post>()
 *   return (
 *     <header data-cms-field="title">
 *       <h1>{post.data.title}</h1>
 *     </header>
 *   )
 * }
 * ```
 */
export function CmsContent<T extends Record<string, any>>({
	initialData,
	children,
}: CmsContentProps<T>) {
	const { isPreviewMode, draftData } = usePreview()

	// Compute the current data based on preview mode and draft data
	// Using useMemo instead of useState + useEffect to avoid infinite loops
	const currentData = useMemo(() => {
		// If not in preview mode or no draft data, return initial data
		if (!isPreviewMode || !draftData || !initialData) {
			return initialData
		}

		// Deep merge draft data into initial data
		return {
			...initialData,
			data: {
				...(initialData as any).data,
				...draftData,
			},
		} as T
	}, [initialData, isPreviewMode, draftData])

	const contextValue = useMemo<CmsContentContextValue<T | null>>(
		() => ({
			data: currentData,
			isPreview: isPreviewMode,
		}),
		[currentData, isPreviewMode],
	)

	return (
		<CmsContentContext.Provider value={contextValue}>
			{children}
		</CmsContentContext.Provider>
	)
}
