"use client"

import { usePreview } from "./preview-context"

type PreviewBannerProps = {
	className?: string
}

/**
 * PreviewBanner - Shows a visual indicator when the page is in preview mode
 *
 * This component displays a small banner at the top of the page indicating
 * that the user is viewing a preview version of the content. It also shows
 * whether the content is a draft or published.
 *
 * @example
 * ```tsx
 * // In your layout or page
 * <PreviewBanner />
 * ```
 */
export function PreviewBanner({ className = "" }: PreviewBannerProps) {
	const { isPreviewMode, draftData } = usePreview()

	if (!isPreviewMode) {
		return null
	}

	const isDraft = (draftData as any)?._isDraft

	return (
		<div
			className={`fixed top-0 right-0 left-0 z-[9999] flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-center text-sm text-white shadow-lg ${className}`}
		>
			<span className="flex items-center gap-2">
				<svg
					className="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
					/>
				</svg>
				<span className="font-medium">Preview Mode</span>
			</span>
			{isDraft && (
				<span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
					Draft
				</span>
			)}
			<span className="text-white/80">•</span>
			<span className="text-xs text-white/80">
				Changes from the CMS editor are reflected here in real-time
			</span>
		</div>
	)
}
