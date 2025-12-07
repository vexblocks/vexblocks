import { api } from "@repo/backend/convex/_generated/api"
import { getStringValue } from "@repo/cms-shared"
import type { Metadata } from "next"
import { Suspense } from "react"
import {
	NavbarThemeInitializer,
	SectionColorDetector,
} from "@/components/wrappers"
import { cachedQuery } from "@/lib/cached-query"
import { CachedPost, DynamicPost } from "./_components"

const SITE_URL = "https://www.vexblocks.com"

type BlogPostPageProps = {
	params: Promise<{ slug: string }>
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
	params,
}: BlogPostPageProps): Promise<Metadata> {
	const { slug } = await params

	const blogSchemaId = await cachedQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	if (!blogSchemaId) {
		return { title: "Article Not Found" }
	}

	const post = await cachedQuery(api.cms.content.getBySlug, {
		schemaId: blogSchemaId,
		slug,
	})

	if (!post) {
		return { title: "Article Not Found" }
	}

	const title = getStringValue(post.data?.title) || "VexBlocks Blog"
	const description =
		getStringValue(post.data?.excerpt) ||
		getStringValue(post.data?.description) ||
		"Read this article on the VexBlocks Blog."
	const imageUrl = post.data?.featuredImage || "/og-image.png"

	return {
		title,
		description,
		openGraph: {
			title: `${title} | VexBlocks`,
			description,
			type: "article",
			url: `${SITE_URL}/blog/${slug}`,
			images: [
				{
					url: imageUrl.startsWith("http")
						? imageUrl
						: `${SITE_URL}${imageUrl}`,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
			publishedTime: post._creationTime
				? new Date(post._creationTime).toISOString()
				: undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} | VexBlocks`,
			description,
			images: [
				imageUrl.startsWith("http") ? imageUrl : `${SITE_URL}${imageUrl}`,
			],
		},
		alternates: {
			canonical: `/blog/${slug}`,
		},
	}
}

export async function generateStaticParams() {
	const blogSchemaId = await cachedQuery(api.cms.schemas.getIdByName, {
		name: "blog_posts",
	})

	if (!blogSchemaId) return []

	const posts = await cachedQuery(api.cms.content.listPublished, {
		schemaId: blogSchemaId,
	})

	return (posts as { slug?: string; data: { slug?: string } }[]).map(
		(post) => ({
			slug: post.slug || post.data.slug,
		}),
	)
}

/**
 * Blog Post Page
 *
 * Architecture with cacheComponents:
 * - getPostData() has "use cache" + cacheLife("days")
 * - Production: CachedPost renders static content
 * - Preview: DynamicPost detects preview mode and uses PreviewPostWrapper
 * - Suspense wraps dynamic content, CachedPost as fallback
 */
export default async function BlogPostPage({
	params,
	searchParams,
}: BlogPostPageProps) {
	const { slug } = await params

	return (
		<>
			<NavbarThemeInitializer
				theme="light"
				additionalClasses="backdrop-blur-sm bg-white/80 border-b border-gray-200 text-gray-900"
				onlyAtTop={true}
			/>
			<SectionColorDetector variant="light">
				{/* Suspense for dynamic searchParams, CachedPost as fallback */}
				<Suspense fallback={<CachedPost slug={slug} />}>
					<DynamicPost slug={slug} searchParams={searchParams} />
				</Suspense>
			</SectionColorDetector>
		</>
	)
}
