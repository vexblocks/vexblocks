"use client"

import { useQuery } from "convex/react"
import type { BlogPostsContent } from "@repo/cms-shared"
import { api } from "vexblocks-backend/convex/_generated/api"
import { BlogPostCard } from "../../_components/blog-post-card"

type RelatedPostsProps = {
	currentPostId: string
	schemaId: string
	tags?: string[]
}

export function RelatedPosts({
	currentPostId,
	schemaId,
	tags,
}: RelatedPostsProps) {
	// Fetch related posts based on tags
	const allPosts = useQuery(api.cms.content.listPublished, {
		schemaId: schemaId as any,
		tags: tags && tags.length > 0 ? tags : undefined,
		limit: 4,
	}) as BlogPostsContent[] | undefined

	// Filter out current post and limit to 3
	const relatedPosts =
		allPosts?.filter((post) => post._id !== currentPostId).slice(0, 3) || []

	if (relatedPosts.length === 0) {
		return null
	}

	return (
		<section className="mt-8 border-t border-gray-200 pt-8 lg:mt-16 lg:pt-16">
			<div className="mx-auto max-w-7xl">
				<h2 className="mb-4 font-serif text-2xl font-normal text-gray-900 lg:mb-8 lg:text-3xl">
					Related Posts
				</h2>
				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{relatedPosts.map((post) => (
						<BlogPostCard key={post._id} post={post} />
					))}
				</div>
			</div>
		</section>
	)
}
