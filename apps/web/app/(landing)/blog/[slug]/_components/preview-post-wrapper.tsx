"use client"

import { useMemo } from "react"
import type { BlogPostsContent } from "@repo/cms-shared"
import { usePreview } from "@repo/cms-shared"
import type { Id } from "vexblocks-backend/convex/_generated/dataModel"
import { Post } from "./post"

type PreviewPostWrapperProps = {
	initialPost: BlogPostsContent | null
	slug: string
	schemaId: Id<"cmsSchemas">
}

/**
 * PreviewPostWrapper - Client Component for live preview
 *
 * Uses the PreviewProvider context from the layout to get draft data.
 * The PreviewProvider already handles postMessage communication with
 * the CMS admin, so we just need to consume the draftData from context.
 *
 * This wrapper is ONLY used in preview mode. In production,
 * the Post component is rendered as a pure Server Component.
 */
export function PreviewPostWrapper({
	initialPost,
	slug,
	schemaId,
}: PreviewPostWrapperProps) {
	// Get draft data from the PreviewProvider in the layout
	const { draftData } = usePreview()

	// Merge draft data with initial post data
	const mergedPost = useMemo(() => {
		if (!initialPost) return null
		if (!draftData) return initialPost

		return {
			...initialPost,
			data: {
				...initialPost.data,
				...draftData,
			},
		} as BlogPostsContent
	}, [initialPost, draftData])

	return <Post post={mergedPost} slug={slug} schemaId={schemaId} />
}
