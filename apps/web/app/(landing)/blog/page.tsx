import type { Metadata } from "next"
import { Suspense } from "react"
import { HeroSection } from "@/components/molecules/hero-section"
import {
	NavbarThemeInitializer,
	SectionColorDetector,
} from "@/components/wrappers"
import { CachedBlog } from "./_components/cached-blog"
import { PostsFilterHandler } from "./_components/posts-filter-handler"

export const metadata: Metadata = {
	title: "Blog - VexBlocks Demo",
	description:
		"Explore articles and guides about VexBlocks, a headless CMS built with Convex.",
	openGraph: {
		title: "Blog | VexBlocks",
		description:
			"Explore articles and guides about VexBlocks, a headless CMS built with Convex.",
	},
	alternates: {
		canonical: "/blog",
	},
}

/**
 * Blog Page
 *
 * Architecture with cacheComponents:
 * - getBlogData() has "use cache" + cacheLife("days")
 * - Data is cached and pre-rendered, no runtime fetch
 * - CachedBlog awaits cached data and renders
 * - PostsFilterHandler does client-side filtering via CSS
 * - Suspense wraps async components (required) but content is cached so no delay
 */
export default async function BlogPage() {
	return (
		<>
			<NavbarThemeInitializer
				theme="dark"
				additionalClasses="backdrop-blur-sm bg-gray-900 border-t border-t-gray-800"
				onlyAtTop={true}
			/>
			<SectionColorDetector variant="dark">
				<HeroSection />
			</SectionColorDetector>

			<SectionColorDetector variant="light">
				{/* Cached content - data has "use cache", renders immediately */}
				<Suspense fallback={null}>
					<CachedBlog />
				</Suspense>

				{/* Client-side filter - uses useSearchParams, needs Suspense */}
				<Suspense fallback={null}>
					<PostsFilterHandler />
				</Suspense>
			</SectionColorDetector>
		</>
	)
}
