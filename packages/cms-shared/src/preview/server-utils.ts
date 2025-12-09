/**
 * Server-side utilities for CMS preview mode
 *
 * These utilities help detect preview mode from searchParams
 * and can be used in Server Components.
 */

export type PreviewParams = {
	isPreview: boolean
	contentId: string | null
	schemaId: string | null
}

/**
 * Parse preview parameters from searchParams
 *
 * Use this in Server Components to detect if we're in preview mode
 * and get the content/schema IDs.
 *
 * @example
 * ```tsx
 * // page.tsx (Server Component)
 * export default async function PostPage({ searchParams }) {
 *   const { isPreview, contentId } = getPreviewParams(await searchParams)
 *
 *   // Fetch data with or without cache based on preview mode
 *   const post = await cachedQuery(
 *     api.cms.content.getById,
 *     { id: contentId },
 *     { skipCache: isPreview }
 *   )
 *
 *   return (
 *     <>
 *       {isPreview && <LivePreviewRefresh />}
 *       <PostContent post={post} />
 *     </>
 *   )
 * }
 * ```
 */
export function getPreviewParams(
	searchParams: Record<string, string | string[] | undefined>,
): PreviewParams {
	const preview = searchParams?.preview
	const contentId = searchParams?.contentId
	const schemaId = searchParams?.schemaId

	return {
		isPreview: preview === "true",
		contentId: typeof contentId === "string" ? contentId : null,
		schemaId: typeof schemaId === "string" ? schemaId : null,
	}
}

/**
 * Check if the current request is a preview request
 *
 * Simpler version of getPreviewParams when you only need the boolean
 *
 * @example
 * ```tsx
 * const isPreview = isPreviewMode(await searchParams)
 * ```
 */
export function isPreviewRequest(
	searchParams: Record<string, string | string[] | undefined>,
): boolean {
	return searchParams?.preview === "true"
}
