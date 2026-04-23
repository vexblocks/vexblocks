"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

type BlogFiltersProps = {
	tags: Array<{ _id: string; name: string }>
}

/**
 * BlogFilters - Client Component for interactive tag filtering
 *
 * Uses URL searchParams for state - when a tag is clicked, it updates
 * the URL which triggers a server-side re-render with filtered content.
 * This keeps the actual filtering logic on the server.
 */
export function BlogFilters({ tags }: BlogFiltersProps) {
	const searchParams = useSearchParams()
	const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? []

	// Build URL for toggling a tag
	const buildTagUrl = (tagId: string) => {
		const newTags = currentTags.includes(tagId)
			? currentTags.filter((id) => id !== tagId)
			: [...currentTags, tagId]

		if (newTags.length === 0) {
			return "/blog"
		}
		return `/blog?tags=${newTags.join(",")}`
	}

	return (
		<div className="flex flex-wrap gap-3">
			<Link
				href="/blog"
				className={cn(
					"cursor-pointer rounded px-3 py-2 text-sm font-medium transition-all",
					currentTags.length === 0
						? "bg-blue-200 text-blue-900"
						: "text-dark-700 hover:bg-blue-200/40",
				)}
			>
				All Posts
			</Link>

			{tags.map((tag) => {
				const isSelected = currentTags.includes(tag._id)
				return (
					<Link
						key={tag._id}
						href={buildTagUrl(tag._id)}
						className={cn(
							"cursor-pointer rounded px-5 py-2 text-sm font-medium transition-all",
							isSelected
								? "bg-blue-200 text-blue-900"
								: "text-dark-700 hover:bg-blue-200/40",
						)}
					>
						{tag.name}
					</Link>
				)
			})}
		</div>
	)
}
