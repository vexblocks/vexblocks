import { cacheLife, cacheTag } from "next/cache"
import { cachedQuery } from "@/lib/cached-query"
import { api } from "@repo/backend/convex/_generated/api"
import type { BlogPostsContent } from "@repo/cms-shared"
import type { Id } from "vexblocks-backend/convex/_generated/dataModel"

export type PostData = {
	post: BlogPostsContent | null
	schemaId: Id<"cmsSchemas"> | null
}

/**
 * Get post data by slug - CACHED
 *
 * This function has "use cache" - all data fetching is cached.
 * Returns post data ready for rendering.
 */
export async function getPostData(slug: string): Promise<PostData> {
	"use cache"
	cacheLife("days")
	cacheTag("blog-posts", `post-${slug}`)

	const schemaId = await cachedQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	if (!schemaId) {
		return { post: null, schemaId: null }
	}

	const post = (await cachedQuery(api.cms.content.getBySlug, {
		schemaId,
		slug,
	})) as BlogPostsContent | null

	return { post, schemaId }
}

/**
 * Get post data for preview mode - NOT CACHED
 *
 * Skips cache for fresh data in preview mode.
 */
export async function getPostDataForPreview(slug: string): Promise<PostData> {
	const schemaId = await cachedQuery(
		api.cms.schemas.getIdByName,
		{ name: "blog_posts" },
		{ skipCache: true },
	)

	if (!schemaId) {
		return { post: null, schemaId: null }
	}

	const post = (await cachedQuery(
		api.cms.content.getBySlug,
		{ schemaId, slug },
		{ skipCache: true },
	)) as BlogPostsContent | null

	return { post, schemaId }
}
