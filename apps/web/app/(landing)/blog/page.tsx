import { api } from "@repo/backend/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { Container } from "@/components/atoms/container"
import { Heading } from "@/components/atoms/heading"
import {
	NavbarThemeInitializer,
	SectionColorDetector,
} from "@/components/wrappers"
import { ContentLibraryClient } from "./_components/content-library-client"

// ISR configuration: Revalidate every day as a fallback, but allow on-demand revalidation
export const revalidate = 86400
// Remove dynamic = "force-static" to allow on-demand revalidation to work properly

export default async function ContentLibraryPage() {
	// Fetch schema IDs
	const blogPostsSchemaId = await fetchQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	const blogTagsSchemaId = await fetchQuery(api.cms.schemas.getIdByName, {
		name: "blog_tags",
	})

	// Fetch featured post
	const featuredPost = blogPostsSchemaId
		? await fetchQuery(api.cms.content.getFeatured, {
				schemaId: blogPostsSchemaId,
			})
		: null

	// Fetch all blog tags
	const tags = blogTagsSchemaId
		? await fetchQuery(api.cms.content.listPublished, {
				schemaId: blogTagsSchemaId,
			})
		: null

	// Fetch all posts
	const posts = blogPostsSchemaId
		? await fetchQuery(api.cms.content.listPublished, {
				schemaId: blogPostsSchemaId,
			})
		: null

	if (!posts) {
		return (
			<>
				<NavbarThemeInitializer
					theme="dark"
					additionalClasses="backdrop-blur-sm bg-gray-900 border-t border-t-gray-800"
					onlyAtTop={true}
				/>
				<SectionColorDetector variant="dark">
					<section className="bg-gray-900 py-20 md:py-32">
						<Container>
							<div className="mx-auto max-w-4xl text-center">
								<Heading as="h1" size="6xl" className="mb-6 text-white">
									Latest Posts & Updates
								</Heading>
								<p className="text-gray-400 text-lg">
									Discover the latest from VexBlocks CMS
								</p>
							</div>
						</Container>
					</section>
				</SectionColorDetector>
				<SectionColorDetector variant="light">
					<div className="bg-gray-100 px-4 py-20 text-center">
						<p className="text-gray-600">
							No blog posts found. Create your first post in the CMS!
						</p>
					</div>
				</SectionColorDetector>
			</>
		)
	}

	return (
		<>
			<NavbarThemeInitializer
				theme="dark"
				additionalClasses="backdrop-blur-sm bg-gray-900 border-t border-t-gray-800"
				onlyAtTop={true}
			/>
			<SectionColorDetector variant="dark">
				<section className="bg-gray-900 py-20 md:py-32">
					<Container>
						<div className="mx-auto max-w-4xl text-center">
							<Heading as="h1" size="6xl" className="mb-6 text-white">
								Latest Posts & Updates
							</Heading>
							<p className="text-gray-400 text-lg">
								Discover the latest from VexBlocks CMS
							</p>
						</div>
					</Container>
				</section>
			</SectionColorDetector>

			<SectionColorDetector variant="light">
				<ContentLibraryClient
					featuredPost={featuredPost}
					tags={tags || []}
					posts={posts}
				/>
			</SectionColorDetector>
		</>
	)
}
