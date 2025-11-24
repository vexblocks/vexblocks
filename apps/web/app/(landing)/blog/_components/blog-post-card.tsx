"use client"

import { useQuery } from "convex/react"
import { api } from "vexblocks-backend/convex/_generated/api"
import type { Id } from "vexblocks-backend/convex/_generated/dataModel"
import Link from "next/link"
import { ArrowRightIcon } from "@/components/icons/arrow-right"
import { CFImage } from "@repo/cms-shared"

import type {
	BlogTagsContent,
	ContentAuthorsContent,
	BlogPostsContent,
} from "@repo/cms-shared"

type BlogPostCardProps = {
	post: BlogPostsContent
}

export function BlogPostCard({ post }: BlogPostCardProps) {
	// Handle author data - can be either an ID string or embedded object
	const authorData = post.data.author
	const isAuthorString = typeof authorData === "string"

	// Always call useQuery, but conditionally skip it
	const fetchedAuthor = useQuery(
		api.cms.content.getPublishedById,
		isAuthorString && authorData
			? { id: authorData as Id<"cmsContent"> }
			: "skip",
	) as ContentAuthorsContent | null | undefined

	// Determine which author data to use
	const _author: ContentAuthorsContent | null | undefined = isAuthorString
		? fetchedAuthor
		: (authorData as ContentAuthorsContent)

	// Handle first tag - can be either an ID string or embedded object
	const firstTagData = post.data.tags?.[0]
	const isTagString = typeof firstTagData === "string"

	// Fetch tag if it's an ID string
	const fetchedTag = useQuery(
		api.cms.content.getPublishedById,
		isTagString && firstTagData
			? { id: firstTagData as Id<"cmsContent"> }
			: "skip",
	) as BlogTagsContent | null | undefined

	// Determine which tag data to use
	const firstTag: BlogTagsContent | null | undefined = isTagString
		? fetchedTag
		: (firstTagData as BlogTagsContent)

	const tagContent = firstTag?.data?.name || null

	// Extract short description from first richText block
	const richTextBlock = post.data.blocks?.find(
		(block: any) => block.type === "richText",
	)

	// Handle both normalized (value) and non-normalized (data) formats
	const lexicalJson = richTextBlock
		? (richTextBlock as any).value || (richTextBlock as any).data
		: null

	const shortDescription = lexicalJson
		? extractTextFromLexical(lexicalJson)
		: ""

	return (
		<Link href={`/blog/${post.data.slug || post.slug}`} className="group block">
			<article className="flex flex-col">
				{/* Image */}
				<div className="relative aspect-16/10 overflow-hidden rounded-xl bg-gray-200">
					{post.data.featured_image ? (
						<CFImage
							assetId={post.data.featured_image}
							alt={post.data.title || "Blog post"}
							width={600}
							height={375}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-gray-400">
							No image
						</div>
					)}
				</div>

				{/* Content */}
				<div className="mt-4 flex flex-col gap-2 lg:gap-3">
					{/* Tag and Read Time */}
					<div className="mb-2 flex items-center gap-2">
						{tagContent && (
							<span className="rounded bg-black px-2 py-1 font-normal text-white text-xs">
								{tagContent}
							</span>
						)}
						<span className="text-gray-600 text-xs">
							{calculateReadingTime(post)}
						</span>
					</div>

					<h3 className="mb-2 font-medium text-gray-900 text-xl transition-colors group-hover:text-red-700">
						{post.data.title}
					</h3>

					{shortDescription && (
						<p className="mb-3 line-clamp-3 text-gray-500 text-sm">
							{shortDescription}
						</p>
					)}

					<div className="flex items-center gap-1 text-gray-900 text-sm transition-colors group-hover:text-red-600">
						<span>Read more</span>
						<ArrowRightIcon />
					</div>
				</div>
			</article>
		</Link>
	)
}

// Helper function to extract text from Lexical JSON
function extractTextFromLexical(
	lexicalJson: string,
	fullExtract = false,
): string {
	try {
		const parsed = JSON.parse(lexicalJson)
		const root = parsed.root

		if (!root || !root.children) return ""

		let text = ""
		const extractFromNode = (node: any): void => {
			if (node.type === "text" && node.text) {
				text += `${node.text} `
			}
			if (node.children && Array.isArray(node.children)) {
				for (const child of node.children) {
					extractFromNode(child)
				}
			}
		}

		for (const child of root.children) {
			extractFromNode(child)
			if (!fullExtract && text.length > 200) break // Stop early if we have enough text for preview
		}

		return text.trim()
	} catch {
		return ""
	}
}

// Helper function to calculate reading time
function calculateReadingTime(post: BlogPostsContent): string {
	let totalWords = 0

	// Extract text from title
	if (post.data.title) {
		totalWords += post.data.title.split(/\s+/).filter(Boolean).length
	}

	// Extract text from all richText blocks
	if (post.data.blocks) {
		for (const block of post.data.blocks) {
			if (block.type === "richText") {
				const lexicalJson = (block as any).value || (block as any).data
				if (lexicalJson) {
					const text = extractTextFromLexical(lexicalJson, true)
					totalWords += text.split(/\s+/).filter(Boolean).length
				}
			} else if (block.type === "longText" || block.type === "shortText") {
				const text = (block as any).value || (block as any).data || ""
				totalWords += String(text).split(/\s+/).filter(Boolean).length
			}
		}
	}

	// Average reading speed: 225 words per minute
	const wordsPerMinute = 225
	const minutes = Math.ceil(totalWords / wordsPerMinute)

	// Return at least 1 minute
	return `${Math.max(1, minutes)} Min Read`
}
