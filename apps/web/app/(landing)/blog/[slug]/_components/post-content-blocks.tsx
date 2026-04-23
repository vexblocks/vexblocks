import type { FlexibleBlock } from "@repo/cms-shared"
import { CFImage, getStringValue, LexicalRenderer } from "@repo/cms-shared"
import { YouTubeEmbed } from "./youtube-embed"

type PostContentBlocksProps = {
	blocks: Array<FlexibleBlock>
}

// Helper to get the value from a flexible block
function getBlockValue(block: FlexibleBlock): unknown {
	return (
		(block as { value?: unknown; data?: unknown }).value ??
		(block as { value?: unknown; data?: unknown }).data
	)
}

/**
 * PostContentBlocks - Server Component for rendering content blocks
 *
 * Receives blocks as props from the parent Server Component.
 * No client-side data fetching or state management.
 *
 * For interactive elements (like YouTube embeds in preview mode),
 * we use minimal Client Components only where necessary.
 */
export function PostContentBlocks({ blocks }: PostContentBlocksProps) {
	if (!blocks || blocks.length === 0) return null

	return (
		<article className="flex flex-col gap-10">
			{blocks.map((block, index) => {
				const value = getBlockValue(block)
				const blockKey = `block-${index}`
				const fieldPath = `blocks[${index}]`

				switch (block.type) {
					case "richText":
						// RichText uses fieldPath prop for paragraph-level selection in preview
						return (
							<div
								key={blockKey}
								className="post-content text-lg leading-[1.6] tracking-[0.36px] text-gray-900"
							>
								<LexicalRenderer
									content={value as string}
									fieldPath={fieldPath}
								/>
							</div>
						)

					case "media":
						return (
							<figure
								key={blockKey}
								className="flex flex-col gap-4"
								data-cms-field={fieldPath}
							>
								<div className="overflow-hidden rounded-[10px]">
									<CFImage
										assetId={value as string}
										alt="Post image"
										width={1000}
										height={500}
										className="w-full"
									/>
								</div>
							</figure>
						)

					case "shortText":
					case "longText":
						return (
							<p
								key={blockKey}
								className="text-lg leading-[1.6] tracking-[0.36px] text-gray-900"
								data-cms-field={fieldPath}
							>
								{getStringValue(value as string)}
							</p>
						)

					case "url":
						return (
							<a
								key={blockKey}
								href={value as string}
								target="_blank"
								rel="noopener noreferrer"
								className="text-lg text-purple-600 hover:underline"
								data-cms-field={fieldPath}
							>
								{value as string}
							</a>
						)

					case "youtubeUrl": {
						const url = value as string
						if (!url) return null

						return (
							<YouTubeEmbed key={blockKey} url={url} fieldPath={fieldPath} />
						)
					}

					case "date":
						return (
							<time
								key={blockKey}
								className="block text-lg text-gray-600"
								data-cms-field={fieldPath}
							>
								{new Date(value as string).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
						)

					case "boolean":
						return (
							<div
								key={blockKey}
								className="text-lg text-gray-900"
								data-cms-field={fieldPath}
							>
								{value ? "Yes" : "No"}
							</div>
						)

					case "select":
						return (
							<div
								key={blockKey}
								className="text-lg text-gray-900"
								data-cms-field={fieldPath}
							>
								{getStringValue(value as string)}
							</div>
						)

					default:
						return null
				}
			})}
		</article>
	)
}
