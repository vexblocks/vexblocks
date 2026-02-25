"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { Layers, Search, X } from "lucide-react"
import { useState } from "react"
import { authAtom } from "@/lib/auth-atom"

type Block = {
	_id: string
	name: string
	displayName: string
	description?: string
	previewImage?: string
	category?: string
	fields: any[]
}

type BlockSelectorDialogProps = {
	onSelect: (block: Block) => void
	onClose: () => void
	selectedBlockId?: string
	title?: string
}

export function BlockSelectorDialog({
	onSelect,
	onClose,
	selectedBlockId,
	title = "Select Block",
}: BlockSelectorDialogProps) {
	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const blocks = useQuery(api.cms.blocks.list, isReady ? {} : "skip")
	const [search, setSearch] = useState("")

	// Group blocks by category
	const groupedBlocks = blocks?.reduce(
		(acc, block) => {
			const category = block.category || "Uncategorized"
			if (!acc[category]) {
				acc[category] = []
			}
			acc[category].push(block)
			return acc
		},
		{} as Record<string, typeof blocks>,
	)

	// Filter blocks by search
	const filteredGroups = groupedBlocks
		? Object.entries(groupedBlocks).reduce(
				(acc, [category, categoryBlocks]) => {
					const filtered = categoryBlocks?.filter(
						(block) =>
							block.displayName.toLowerCase().includes(search.toLowerCase()) ||
							block.name.toLowerCase().includes(search.toLowerCase()) ||
							block.description?.toLowerCase().includes(search.toLowerCase()),
					)
					if (filtered && filtered.length > 0) {
						acc[category] = filtered
					}
					return acc
				},
				{} as Record<string, Block[]>,
			)
		: {}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="flex h-[95vh] w-full max-w-[95vw] flex-col rounded-lg bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-grey-200 border-b px-6 py-4">
					<h2 className="font-semibold text-primary text-xl">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-grey-500 transition-colors hover:text-grey-700"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Search */}
				<div className="border-grey-200 border-b px-6 py-3">
					<div className="relative">
						<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-grey-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search blocks..."
							className="w-full rounded-lg border border-grey-300 py-2 pr-4 pl-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto bg-grey-50 p-6">
					{blocks === undefined ? (
						<div className="flex min-h-50 items-center justify-center">
							<div className="text-center">
								<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
								<p className="text-grey-500">Loading blocks...</p>
							</div>
						</div>
					) : Object.keys(filteredGroups).length === 0 ? (
						<div className="flex min-h-50 items-center justify-center">
							<div className="text-center">
								<Layers className="mx-auto mb-4 h-12 w-12 text-grey-400" />
								<p className="text-grey-500">
									{search
										? "No blocks match your search"
										: "No blocks available"}
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-6">
							{Object.entries(filteredGroups).map(
								([category, categoryBlocks]) => (
									<div key={category}>
										<h3 className="mb-3 font-semibold text-grey-700">
											{category}
										</h3>
										<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
											{categoryBlocks?.map((block) => (
												<button
													key={block._id}
													type="button"
													onClick={() => onSelect(block)}
													className={`group relative flex flex-col overflow-hidden rounded-lg border-2 bg-white text-left transition-all hover:border-primary hover:shadow-lg ${
														selectedBlockId === block._id
															? "border-primary ring-2 ring-primary/20"
															: "border-grey-200"
													}`}
												>
													{/* Preview Image or Placeholder */}
													<div className="relative h-32 w-full bg-grey-100">
														{block.previewImage ? (
															<CFImage
																assetId={block.previewImage}
																alt={block.displayName}
																fill
																variant="public"
																className="object-cover"
															/>
														) : (
															<div className="flex h-full w-full items-center justify-center">
																<Layers className="h-12 w-12 text-grey-300" />
															</div>
														)}
														{selectedBlockId === block._id && (
															<div className="absolute top-2 right-2 rounded-full bg-primary p-1 text-white">
																<svg
																	className="h-4 w-4"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															</div>
														)}
													</div>

													{/* Block Info */}
													<div className="flex flex-1 flex-col p-4">
														<h4 className="mb-1 font-semibold text-grey-900 group-hover:text-primary">
															{block.displayName}
														</h4>
														{block.description ? (
															<p className="line-clamp-2 flex-1 text-grey-500 text-sm">
																{block.description}
															</p>
														) : (
															<p className="line-clamp-2 flex-1 text-grey-400 text-sm italic">
																No description
															</p>
														)}
														<div className="mt-2 flex items-center justify-between">
															<code className="rounded bg-grey-100 px-2 py-0.5 font-mono text-grey-600 text-xs">
																{block.name}
															</code>
															<span className="text-grey-400 text-xs">
																{block.fields.length} field
																{block.fields.length !== 1 ? "s" : ""}
															</span>
														</div>
													</div>
												</button>
											))}
										</div>
									</div>
								),
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="border-grey-200 border-t bg-white px-6 py-4">
					<div className="flex items-center justify-between text-grey-500 text-sm">
						<p>Click on a block to select it</p>
						<button
							type="button"
							onClick={onClose}
							className="font-medium text-primary hover:underline"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
