"use client"

import { useIsPreviewMode } from "@repo/cms-shared"

type YouTubeEmbedProps = {
	url: string
	fieldPath: string
}

function getYouTubeEmbedUrl(url: string): string {
	if (!url) return ""
	if (url.includes("youtu.be/")) {
		const videoId = url.split("youtu.be/")[1]?.split("?")[0]
		return `https://www.youtube.com/embed/${videoId}`
	}
	if (url.includes("watch?v=")) {
		const videoId = url.split("watch?v=")[1]?.split("&")[0]
		return `https://www.youtube.com/embed/${videoId}`
	}
	if (url.includes("/embed/")) return url
	return ""
}

/**
 * YouTubeEmbed - Minimal Client Component for YouTube embeds
 *
 * This needs to be a Client Component only because of the
 * preview mode overlay that intercepts clicks for visual editing.
 */
export function YouTubeEmbed({ url, fieldPath }: YouTubeEmbedProps) {
	const isPreview = useIsPreviewMode()
	const embedUrl = getYouTubeEmbedUrl(url)

	if (!embedUrl) return null

	return (
		<div
			className="relative aspect-video w-full overflow-hidden rounded-[10px]"
			data-cms-field={fieldPath}
		>
			<iframe
				src={embedUrl}
				title="YouTube video"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
				className="h-full w-full"
			/>
			{/* Overlay to intercept clicks in preview mode - navigates to editor section */}
			{isPreview && (
				<div
					className="absolute inset-0 cursor-pointer"
					title="Click to edit this YouTube block"
				/>
			)}
		</div>
	)
}

