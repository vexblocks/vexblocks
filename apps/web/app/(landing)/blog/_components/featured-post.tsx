import type { BlogPostsContent } from "@repo/cms-shared"
import { CFImage, getStringValue } from "@repo/cms-shared"
import Link from "next/link"

type FeaturedPostProps = {
	post: BlogPostsContent
	authorName?: string | null
}

/**
 * FeaturedPost - Server Component
 * No client-side data fetching, all data passed as props
 */
export function FeaturedPost({ post, authorName }: FeaturedPostProps) {
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
		<Link href={`/blog/${post.data.slug || post.slug}`} className="group block">
			<article className="grid gap-8 md:grid-cols-2 md:gap-12">
				{/* Image */}
				<div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-gray-200">
					{post.data.featured_image ? (
						<CFImage
							assetId={post.data.featured_image}
							alt={title || "Featured post"}
							width={800}
							height={500}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-gray-400">
							No image
						</div>
					)}
				</div>

				{/* Content */}
				<div className="flex flex-col justify-center">
					<div className="mb-3 inline-flex items-center gap-2">
						<span className="rounded-full bg-purple-100 px-3 py-1 font-medium text-purple-700 text-sm">
							Featured
						</span>
					</div>

					<h2 className="mb-4 font-normal font-serif text-3xl text-gray-900 transition-colors group-hover:text-purple-600 md:text-4xl lg:text-5xl">
						{title}
					</h2>

					{shortDescription && (
						<p className="mb-6 line-clamp-3 text-gray-600 text-lg">
							{shortDescription}
						</p>
					)}

					<div className="flex items-center gap-4 text-gray-500 text-sm">
						{authorName && <span className="font-medium">{authorName}</span>}
						<time dateTime={new Date(post._creationTime).toISOString()}>
							{new Date(post._creationTime).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</time>
					</div>
				</div>
			</article>
		</Link>
	)
}

// Helper function to extract text from Lexical JSON
function extractTextFromLexical(lexicalJson: string): string {
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
			if (text.length > 250) break // Stop early if we have enough text
		}

		return text.trim()
	} catch {
		return ""
	}
}
