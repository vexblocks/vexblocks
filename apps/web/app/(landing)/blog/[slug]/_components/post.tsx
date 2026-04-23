import { Container } from "@/components/atoms/container"
import type { BlogPostsContent } from "@repo/cms-shared"
import { getStringValue } from "@repo/cms-shared"
import type { Id } from "vexblocks-backend/convex/_generated/dataModel"
import { AuthorInfo } from "./author-info"
import { PostContentBlocks } from "./post-content-blocks"
import { PostTags } from "./post-tags"
import { RelatedPosts } from "./related-posts"
import { ShareSection } from "./share-section"

type PostProps = {
	post: BlogPostsContent | null
	slug: string
	schemaId: Id<"cmsSchemas">
}

/**
 * Post - Server Component for rendering blog posts
 *
 * This is a pure Server Component - no data is sent to the client.
 * Data is fetched at the page level and passed as props.
 *
 * In preview mode, LivePreviewRefresh handles updates by triggering
 * router.refresh() which re-renders this component with fresh data.
 */
export function Post({ post, slug, schemaId }: PostProps) {
	// Not found state
	if (!post) {
		return (
			<div className="bg-white px-4 py-20 md:px-0">
				<Container>
					<div className="py-20 text-center">
						<h1 className="mb-4 font-serif text-4xl font-normal text-gray-900">
							Post not found
						</h1>
						<p className="text-lg text-gray-600">
							The post you're looking for doesn't exist or has been removed.
						</p>
					</div>
				</Container>
			</div>
		)
	}

	// Extract tag IDs for related posts
	const tagIds = post.data.tags

	const title = getStringValue(post.data.title)

	return (
		<div className="bg-gray-100 px-4 py-12 pt-20 md:px-0 md:py-20">
			<Container>
				<div className="mx-auto max-w-[1000px]">
					{/* Header */}
					<header className="mb-7 lg:mb-10" data-cms-field="title">
						<h1 className="font-serif text-3xl leading-tight font-normal tracking-tight text-gray-900 md:text-6xl lg:text-5xl">
							{title}
						</h1>
					</header>

					{/* Content blocks */}
					<PostContentBlocks blocks={post.data.blocks} />

					{/* Share and Tags Section */}
					<div className="mt-8 flex flex-col gap-6 lg:mt-12 lg:gap-12">
						<div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
							<div className="flex-1">
								<ShareSection title={title} slug={slug} />
							</div>

							{post.data.tags && post.data.tags.length > 0 && (
								<div className="shrink-0">
									<PostTags tags={post.data.tags} />
								</div>
							)}
						</div>

						<div className="border-t border-gray-300" />

						{post.data.author && <AuthorInfo author={post.data.author} />}
					</div>

					{schemaId && (
						<div className="mt-16">
							<RelatedPosts
								currentPostId={post._id}
								schemaId={schemaId}
								tags={tagIds}
							/>
						</div>
					)}
				</div>
			</Container>
		</div>
	)
}
