import { getPreviewParams } from "@repo/cms-shared"
import { CachedPost } from "./cached-post"
import { getPostDataForPreview } from "./get-post-data"
import { PreviewPostWrapper } from "./preview-post-wrapper"

type DynamicPostProps = {
	slug: string
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * DynamicPost - Handles preview mode detection
 *
 * - If not in preview mode: renders CachedPost (static)
 * - If in preview mode: fetches fresh data and uses PreviewPostWrapper
 *
 * This component accesses searchParams and must be wrapped in Suspense.
 */
export async function DynamicPost({ slug, searchParams }: DynamicPostProps) {
	const resolvedSearchParams = await searchParams
	const { isPreview } = getPreviewParams(resolvedSearchParams)

	// If not in preview mode, render the cached Server Component version
	if (!isPreview) {
		return <CachedPost slug={slug} />
	}

	// Preview mode: fetch fresh data and use client-side wrapper
	const { post, schemaId } = await getPostDataForPreview(slug)

	if (!schemaId) {
		return null
	}

	// In preview mode, use PreviewPostWrapper which:
	// 1. Receives initial server data
	// 2. Listens for CMS updates via postMessage
	// 3. Merges draft data client-side (no page refresh needed)
	return (
		<PreviewPostWrapper initialPost={post} slug={slug} schemaId={schemaId} />
	)
}
