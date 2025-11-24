"use client"

import type { ContentLibraryContent } from "@repo/cms-shared"
import { BlogPostCard } from "./blog-post-card"

type BlogPostsGridProps = {
	posts: ContentLibraryContent[]
}

export function BlogPostsGrid({ posts }: BlogPostsGridProps) {
	if (posts.length === 0) {
		return (
			<div className="py-20 text-center">
				<p className="text-gray-500 text-lg">
					No posts found. Try selecting different tags.
				</p>
			</div>
		)
	}

	return (
		<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
			{posts.map((post) => (
				<BlogPostCard key={post._id} post={post} />
			))}
		</div>
	)
}
