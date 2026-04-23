import { cacheLife, cacheTag } from "next/cache"
import { cachedQuery } from "@/lib/cached-query"
import { api } from "@repo/backend/convex/_generated/api"
import type {
	BlogPostsContent,
	BlogTagsContent,
	ContentAuthorsContent,
} from "@repo/cms-shared"
import { getStringValue } from "@repo/cms-shared"

export type BlogData = {
	featuredPost: BlogPostsContent | null
	regularPosts: BlogPostsContent[]
	tags: BlogTagsContent[]
	tagsForDisplay: Array<{ _id: string; name: string }>
	featuredAuthorName: string | null | undefined
}

/**
 * Get all blog data - CACHED
 *
 * This function has "use cache" - all data fetching is cached.
 * Returns fully resolved data ready for rendering.
 */
export async function getBlogData(): Promise<BlogData> {
	"use cache"
	cacheLife("days")
	cacheTag("blog")

	// Fetch schema IDs
	const blogSchemaId = await cachedQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	const blogTagsSchemaId = await cachedQuery(api.cms.schemas.getIdByName, {
		name: "blog_tags",
	})

	if (!blogSchemaId || !blogTagsSchemaId) {
		return {
			featuredPost: null,
			regularPosts: [],
			tags: [],
			tagsForDisplay: [],
			featuredAuthorName: null,
		}
	}

	// Fetch all data in parallel
	const [featuredPost, posts, tags] = await Promise.all([
		cachedQuery(api.cms.content.getFeatured, {
			schemaId: blogSchemaId,
		}) as Promise<BlogPostsContent | null>,
		cachedQuery(api.cms.content.listPublished, {
			schemaId: blogSchemaId,
		}) as Promise<BlogPostsContent[]>,
		cachedQuery(api.cms.content.listPublished, {
			schemaId: blogTagsSchemaId,
		}) as Promise<BlogTagsContent[]>,
	])

	if (!posts || posts.length === 0) {
		return {
			featuredPost: null,
			regularPosts: [],
			tags: [],
			tagsForDisplay: [],
			featuredAuthorName: null,
		}
	}

	// Create author map for resolving author names
	const authorIds = new Set<string>()
	for (const post of posts) {
		if (typeof post.data.author === "string") {
			authorIds.add(post.data.author)
		}
	}
	if (featuredPost && typeof featuredPost.data.author === "string") {
		authorIds.add(featuredPost.data.author)
	}

	// Fetch all authors
	const authors = new Map<string, string>()
	for (const authorId of authorIds) {
		const author = (await cachedQuery(api.cms.content.getPublishedById, {
			id: authorId as any,
		})) as ContentAuthorsContent | null
		if (author) {
			authors.set(authorId, getStringValue(author.data.name) ?? "")
		}
	}

	// Filter out the featured post from regular posts
	const regularPosts = posts.filter((post) => post._id !== featuredPost?._id)

	// Transform tags for display
	const tagsForDisplay = tags.map((tag) => ({
		_id: tag._id,
		name: getStringValue(tag.data.name) ?? "",
	}))

	// Get featured post author name
	const featuredAuthorName = featuredPost
		? typeof featuredPost.data.author === "string"
			? authors.get(featuredPost.data.author)
			: getStringValue(
					(featuredPost.data.author as ContentAuthorsContent)?.data?.name,
				)
		: null

	return {
		featuredPost,
		regularPosts,
		tags,
		tagsForDisplay,
		featuredAuthorName,
	}
}
