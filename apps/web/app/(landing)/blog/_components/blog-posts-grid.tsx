import type { BlogPostsContent, BlogTagsContent } from "@repo/cms-shared"
import { getStringValue } from "@repo/cms-shared"
import { BlogPostCard } from "./blog-post-card"

type BlogPostsGridProps = {
	posts: BlogPostsContent[]
	tags: BlogTagsContent[]
}

/**
 * BlogPostsGrid - Server Component
 * Renders a grid of blog post cards with data-tags for client-side filtering
 */
export function BlogPostsGrid({ posts, tags }: BlogPostsGridProps) {
	if (posts.length === 0) {
		return (
			<div className="py-20 text-center">
				<p className="text-lg text-gray-500">
					No posts found. Try selecting different tags.
				</p>
			</div>
		)
	}

	// Create a map for quick tag lookup
	const tagMap = new Map(
		tags.map((tag) => [tag._id, getStringValue(tag.data.name)]),
	)

	return (
		<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" data-posts-grid>
			{posts.map((post) => {
				// Get all tag IDs for this post
				const tagIds = post.data.tags?.join(",") ?? ""

				// Get the first tag name for display
				const firstTag = post.data.tags?.[0]
				const tagName = firstTag ? (tagMap.get(firstTag) ?? null) : null

				return (
					<div key={post._id} className="h-full" data-post-tags={tagIds}>
						<BlogPostCard post={post} tagName={tagName} />
					</div>
				)
			})}
		</div>
	)
}
