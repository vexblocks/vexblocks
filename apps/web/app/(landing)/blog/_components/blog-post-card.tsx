import Link from "next/link"
import { Heading } from "@/components/atoms/heading"
import { Text } from "@/components/atoms/text"
import { ArrowRightIcon } from "@/components/icons/arrow-right"
import type { BlogPostsContent } from "@repo/cms-shared"
import { CFImage, getStringValue } from "@repo/cms-shared"

type BlogPostCardProps = {
	post: BlogPostsContent
	tagName?: string | null
}

/**
 * BlogPostCard - Server Component
 * No client-side data fetching, all data passed as props
 */
export function BlogPostCard({ post, tagName }: BlogPostCardProps) {
	// Extract short description from first richText block
	const richTextBlock = post.data.blocks?.find(
		(block: { type: string }) => block.type === "richText",
	)

	// Handle both normalized (value) and non-normalized (data) formats
	const lexicalJson = richTextBlock
		? ((richTextBlock as { value?: string; data?: string }).value ??
			(richTextBlock as { value?: string; data?: string }).data)
		: null

	const shortDescription = lexicalJson
		? extractTextFromLexical(lexicalJson)
		: ""

	const title = getStringValue(post.data.title)

	return (
		<Link
			href={`/blog/${post.data.slug || post.slug}`}
			className="group block h-full rounded-lg bg-white p-2"
		>
			<article className="flex h-full flex-col">
				{/* Image */}
				<div className="relative aspect-16/10 max-h-[210px] overflow-hidden rounded-sm bg-gray-200">
					{post.data.featured_image ? (
						<CFImage
							assetId={post.data.featured_image}
							alt={title || "Blog post"}
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
				<div className="mt-5 mb-3 flex flex-1 flex-col gap-2 px-4 lg:gap-4">
					{/* Tag and Read Time */}
					<div className="flex items-center gap-2">
						{tagName && (
							<span className="rounded-lg bg-blue-200 px-2 py-1 text-sm font-medium text-blue-900">
								{tagName}
							</span>
						)}
						<span className="text-base leading-normal font-medium text-dark-700">
							{calculateReadingTime(post)}
						</span>
					</div>

					<Heading
						size="xl"
						className="font-sans leading-5.5 font-medium text-gray-900 transition-colors group-hover:text-blue-700"
					>
						{title}
					</Heading>

					{shortDescription && (
						<Text className="line-clamp-3 leading-5.5 text-dark-700">
							{shortDescription}
						</Text>
					)}

					<div className="mt-auto flex items-center gap-1 text-dark-900 transition-colors group-hover:text-blue-600">
						<span>Read more</span>
						<ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
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
		const children = root?.children

		if (!Array.isArray(children)) return ""

		let text = ""
		const extractFromNode = (node: {
			type?: string
			text?: string
			children?: unknown[]
		}): void => {
			if (node.type === "text" && node.text) {
				text += `${node.text} `
			}
			if (node.children && Array.isArray(node.children)) {
				for (const child of node.children) {
					extractFromNode(child as typeof node)
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

	// Extract text from title (handle both string and localized object format)
	const title = getStringValue(post.data.title)
	if (title) {
		totalWords += title.split(/\s+/).filter(Boolean).length
	}

	// Extract text from all richText blocks
	if (post.data.blocks) {
		for (const block of post.data.blocks) {
			if (block.type === "richText") {
				const lexicalJson =
					(block as { value?: string }).value ??
					(block as { data?: string }).data
				if (lexicalJson) {
					const text = extractTextFromLexical(lexicalJson as string, true)
					totalWords += text.split(/\s+/).filter(Boolean).length
				}
			} else if (block.type === "longText" || block.type === "shortText") {
				const text =
					(block as { value?: string }).value ??
					(block as { data?: string }).data ??
					""
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
