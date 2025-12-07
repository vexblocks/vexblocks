import { Container } from "@/components/atoms/container"
import { BlogFilters } from "./blog-filters"
import { BlogPostsGrid } from "./blog-posts-grid"
import { FeaturedPost } from "./featured-post"
import { getBlogData } from "./get-blog-data"

/**
 * CachedBlog - Renders cached blog content
 *
 * Data is fetched via getBlogData() which has "use cache".
 * This component awaits the cached data and renders it.
 */
export async function CachedBlog() {
	const {
		featuredPost,
		regularPosts,
		tags,
		tagsForDisplay,
		featuredAuthorName,
	} = await getBlogData()

	if (regularPosts.length === 0) {
		return null
	}

	return (
		<div className="bg-gray-100 px-4 py-20 md:px-0">
			<Container>
				{/* Featured Post - hidden by PostsFilterHandler when filters active */}
				{featuredPost && (
					<div className="mb-16" data-featured-post>
						<FeaturedPost post={featuredPost} authorName={featuredAuthorName} />
					</div>
				)}

				{/* Filters */}
				{tagsForDisplay.length > 0 && (
					<div className="mb-6">
						<BlogFilters tags={tagsForDisplay} />
					</div>
				)}

				{/* Posts Grid */}
				<div>
					<BlogPostsGrid posts={regularPosts} tags={tags} />
				</div>
			</Container>
		</div>
	)
}
