"use client"

import { cn } from "@/lib/utils"

type BlogFiltersProps = {
	tags: Array<{ _id: string; name: string }>
	selectedTags: string[]
	onTagToggle: (tagId: string) => void
}

export function BlogFilters({
	tags,
	selectedTags,
	onTagToggle,
}: BlogFiltersProps) {
	return (
		<div className="flex flex-wrap gap-3">
			<button
				type="button"
				onClick={() => {
					// Clear all filters by toggling all selected tags
					for (const tag of selectedTags) {
						onTagToggle(tag)
					}
				}}
				className={cn(
					"rounded px-5 py-2 font-normal text-sm transition-all",
					selectedTags.length === 0
						? "bg-black text-white"
						: "bg-gray-100 text-gray-900 hover:bg-gray-200",
				)}
			>
				All Posts
			</button>

			{tags.map((tag) => {
				const isSelected = selectedTags.includes(tag._id)
				return (
					<button
						key={tag._id}
						type="button"
						onClick={() => onTagToggle(tag._id)}
						className={cn(
							"rounded px-5 py-2 font-normal text-sm transition-all",
							isSelected
								? "bg-black text-white"
								: "bg-gray-100 text-gray-900 hover:bg-gray-200",
						)}
					>
						{tag.name}
					</button>
				)
			})}
		</div>
	)
}
