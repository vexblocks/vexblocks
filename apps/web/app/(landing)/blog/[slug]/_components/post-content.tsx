"use client"

import type { ContentLibraryContent } from "@repo/cms-shared"
import { CFImage, LexicalRenderer } from "@repo/cms-shared"

type PostContentProps = {
	post: ContentLibraryContent
}

// Helper to get the value from a flexible block
function getBlockValue(block: any): any {
	return block.value ?? block.data
}

export function PostContent({ post }: PostContentProps) {
	return (
		<article className="flex flex-col gap-10">
			{post.data.blocks?.map((block, index) => {
				const value = getBlockValue(block)
				const blockKey = (block as any)._id || `block-${index}`

				switch (block.type) {
					case "richText":
						return (
							<div
								key={blockKey}
								className="post-content text-gray-900 text-lg leading-[1.6] tracking-[0.36px]"
							>
								<LexicalRenderer content={value} />
							</div>
						)

					case "media":
						return (
							<figure key={blockKey} className="flex flex-col gap-4">
								<div className="overflow-hidden rounded-[10px]">
									<CFImage
										assetId={value}
										alt="Post image"
										width={1000}
										height={500}
										className="w-full"
									/>
								</div>
								{/* Optional: Add caption support if needed */}
							</figure>
						)

					case "shortText":
					case "longText":
						return (
							<p
								key={blockKey}
								className="text-gray-900 text-lg leading-[1.6] tracking-[0.36px]"
							>
								{value}
							</p>
						)

					case "url":
						return (
							<a
								key={blockKey}
								href={value}
								target="_blank"
								rel="noopener noreferrer"
								className="text-lg text-teal-700 hover:underline"
							>
								{value}
							</a>
						)

					case "youtubeUrl": {
						// Extract video ID from YouTube URL
						const getYouTubeEmbedUrl = (url: string): string => {
							if (!url) return ""

							// Handle youtu.be short URLs
							if (url.includes("youtu.be/")) {
								const videoId = url.split("youtu.be/")[1]?.split("?")[0]
								return `https://www.youtube.com/embed/${videoId}`
							}

							// Handle youtube.com URLs
							if (url.includes("watch?v=")) {
								const videoId = url.split("watch?v=")[1]?.split("&")[0]
								return `https://www.youtube.com/embed/${videoId}`
							}

							// If already an embed URL, return as is
							if (url.includes("/embed/")) {
								return url
							}

							return ""
						}

						const embedUrl = getYouTubeEmbedUrl(value)

						if (!embedUrl) return null

						return (
							<div
								key={blockKey}
								className="aspect-video w-full overflow-hidden rounded-[10px]"
							>
								<iframe
									src={embedUrl}
									title="YouTube video"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowFullScreen
									className="h-full w-full"
								/>
							</div>
						)
					}

					case "date":
						return (
							<time key={blockKey} className="block text-gray-600 text-lg">
								{new Date(value).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
						)

					case "boolean":
						return (
							<div key={blockKey} className="text-gray-900 text-lg">
								{value ? "Yes" : "No"}
							</div>
						)

					case "select":
						return (
							<div key={blockKey} className="text-gray-900 text-lg">
								{value}
							</div>
						)

					default:
						return null
				}
			})}
		</article>
	)
}
