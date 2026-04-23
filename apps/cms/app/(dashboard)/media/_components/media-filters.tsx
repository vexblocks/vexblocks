"use client"

import { Search, X } from "lucide-react"
import { useState } from "react"

type MediaFiltersProps = {
	onSearchChange: (search: string) => void
	onTagsChange: (tags: string[]) => void
	availableTags: Array<{ name: string; count: number }>
	selectedTags: string[]
}

export function MediaFilters({
	onSearchChange,
	onTagsChange,
	availableTags,
	selectedTags,
}: MediaFiltersProps) {
	const [searchInput, setSearchInput] = useState("")

	const handleSearchChange = (value: string) => {
		setSearchInput(value)
		onSearchChange(value)
	}

	const handleToggleTag = (tag: string) => {
		if (selectedTags.includes(tag)) {
			onTagsChange(selectedTags.filter((t) => t !== tag))
		} else {
			onTagsChange([...selectedTags, tag])
		}
	}

	const handleClearFilters = () => {
		setSearchInput("")
		onSearchChange("")
		onTagsChange([])
	}

	const hasActiveFilters = searchInput || selectedTags.length > 0

	return (
		<div className="rounded-lg bg-white p-4 shadow-sm">
			<div className="space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-grey-400" />
					<input
						type="text"
						value={searchInput}
						onChange={(e) => handleSearchChange(e.target.value)}
						placeholder="Search by caption or filename..."
						className="w-full rounded-lg border border-grey-300 py-2 pr-4 pl-10 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
					{searchInput && (
						<button
							type="button"
							onClick={() => handleSearchChange("")}
							className="hover:text-grey-600 absolute top-1/2 right-3 -translate-y-1/2 text-grey-400"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>

				{/* Tags Filter */}
				{availableTags.length > 0 && (
					<div>
						<div className="mb-2 flex items-center justify-between">
							<p className="text-sm font-medium text-grey-500">
								Filter by Tags
							</p>
							{hasActiveFilters && (
								<button
									type="button"
									onClick={handleClearFilters}
									className="text-xs text-primary hover:underline"
								>
									Clear all
								</button>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							{availableTags.map((tag) => {
								const isSelected = selectedTags.includes(tag.name)
								return (
									<button
										type="button"
										key={tag.name}
										onClick={() => handleToggleTag(tag.name)}
										className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
											isSelected
												? "bg-primary text-white"
												: "text-grey-700 bg-grey-100 hover:bg-grey-200"
										}`}
									>
										{tag.name}
										<span
											className={`rounded-full px-1.5 py-0.5 text-xs ${
												isSelected
													? "bg-white/20 text-white"
													: "text-grey-600 bg-grey-200"
											}`}
										>
											{tag.count}
										</span>
									</button>
								)
							})}
						</div>
					</div>
				)}

				{/* Active Filters Summary */}
				{hasActiveFilters && (
					<div className="flex items-center gap-2 rounded border border-primary/20 bg-primary/5 p-2">
						<span className="text-xs font-medium text-primary">
							Active filters:
						</span>
						{searchInput && (
							<span className="text-grey-700 rounded bg-white px-2 py-0.5 text-xs">
								Search: "{searchInput}"
							</span>
						)}
						{selectedTags.length > 0 && (
							<span className="text-grey-700 rounded bg-white px-2 py-0.5 text-xs">
								{selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""}
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
