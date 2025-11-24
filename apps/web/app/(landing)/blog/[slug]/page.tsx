import { api } from "@repo/backend/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import {
	NavbarThemeInitializer,
	SectionColorDetector,
} from "@/components/wrappers"
import { PostClient } from "./_components/post-client"

// ISR configuration: Revalidate every day as a fallback, but allow on-demand revalidation
export const revalidate = 86400
// Remove dynamic = "force-static" to allow on-demand revalidation to work properly

type ContentLibraryPostPageProps = {
	params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
	const blogPostsSchemaId = await fetchQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	if (!blogPostsSchemaId) return []

	const posts = await fetchQuery(api.cms.content.listPublished, {
		schemaId: blogPostsSchemaId,
	})

	return posts.map((post: any) => ({
		slug: post.slug || post.data.slug,
	}))
}

export default async function ContentLibraryPostPage({
	params,
}: ContentLibraryPostPageProps) {
	const { slug } = await params

	const blogPostsSchemaId = await fetchQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	if (!blogPostsSchemaId) {
		return (
			<div className="min-h-screen bg-white px-4 py-20 text-center">
				<p className="text-gray-600">
					Blog schema not found. Please create a blog_posts schema in the CMS.
				</p>
			</div>
		)
	}

	// Fetch the post data
	const post = await fetchQuery(api.cms.content.getBySlug, {
		schemaId: blogPostsSchemaId,
		slug,
	})

	if (!post) {
		return (
			<div className="min-h-screen bg-white px-4 py-20 text-center">
				<p className="text-gray-600">Post not found.</p>
			</div>
		)
	}

	return (
		<>
			<NavbarThemeInitializer
				theme="light"
				additionalClasses="backdrop-blur-sm bg-white/80 border-b border-gray-200 text-gray-900"
				onlyAtTop={true}
			/>
			<SectionColorDetector variant="light">
				<PostClient post={post} slug={slug} schemaId={blogPostsSchemaId} />
			</SectionColorDetector>
		</>
	)
}
