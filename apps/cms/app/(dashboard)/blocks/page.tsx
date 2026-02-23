"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared"
import { Layers, Plus, ZoomIn } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useCachedQuery } from "@/lib/use-cached-query"

export default function BlocksPage() {
	const {
		data: blocks,
		isPending,
		error,
	} = useCachedQuery(api.cms.blocks.list, {})

	const [previewBlock, setPreviewBlock] = useState<
		NonNullable<typeof blocks>[number] | null
	>(null)

	// Show loading state only on initial load (not on navigation)
	if (isPending && !blocks) {
		return (
			<div className="flex min-h-100 items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading blocks...</p>
				</div>
			</div>
		)
	}

	if (error || !blocks) {
		return (
			<div className="flex min-h-100 items-center justify-center">
				<div className="text-center">
					<p className="text-error">Unauthorized access</p>
				</div>
			</div>
		)
	}

	// Group blocks by category
	const categorizedBlocks = blocks.reduce(
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

	return (
		<>
			<div>
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-primary">Reusable Blocks</h1>
						<p className="mt-2 text-grey-500">
							{blocks.length} block{blocks.length !== 1 ? "s" : ""} available
						</p>
					</div>
				</div>

				{blocks.length === 0 ? (
					<div className="rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 p-12 text-center">
						<Layers className="mx-auto mb-4 h-12 w-12 text-grey-400" />
						<h3 className="mb-2 font-semibold text-grey-900 text-lg">
							No blocks yet
						</h3>
						<p className="mb-4 text-grey-500">
							Create your first reusable block to get started
						</p>
						<Link
							href="/blocks/new"
							className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
						>
							<Plus className="h-4 w-4" />
							Create Block
						</Link>
					</div>
				) : (
					<div className="space-y-8 pb-24">
						{Object.entries(categorizedBlocks).map(
							([category, categoryBlocks]) => (
								<div key={category}>
									<h2 className="mb-3 font-semibold text-base text-grey-700">
										{category}
										<span className="ml-2 font-normal text-grey-400 text-sm">
											({categoryBlocks.length})
										</span>
									</h2>
									<div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
										{categoryBlocks.map((block) => (
											<div
												key={block._id}
												className="group flex flex-col overflow-hidden rounded-lg border border-grey-200 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md"
											>
												<Link href={`/blocks/${block._id}`} className="flex-1">
													{/* Preview Image */}
													{block.previewImage ? (
														<div className="relative h-32 w-full overflow-hidden bg-grey-100">
															<CFImage
																assetId={block.previewImage}
																alt={block.displayName}
																fill
																variant="public"
																className="object-contain transition-transform group-hover:scale-105"
															/>
															<button
																type="button"
																onClick={(e) => {
																	e.preventDefault()
																	e.stopPropagation()
																	setPreviewBlock(block)
																}}
																className="absolute top-1.5 right-1.5 rounded-md bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
																aria-label="View full image"
															>
																<ZoomIn className="h-3.5 w-3.5" />
															</button>
														</div>
													) : (
														<div className="flex h-24 w-full items-center justify-center bg-grey-50">
															<Layers className="h-10 w-10 text-grey-300" />
														</div>
													)}
													<div className="p-3">
														<div className="mb-1 flex items-center gap-1.5">
															{block.icon && (
																<span className="text-sm">{block.icon}</span>
															)}
															<h3 className="font-semibold text-grey-900 text-sm leading-tight group-hover:text-primary">
																{block.displayName}
															</h3>
														</div>
														<p className="text-grey-400 text-xs">
															{block.fields.length} field
															{block.fields.length !== 1 ? "s" : ""}
														</p>
														{block.description && (
															<p className="mt-1 line-clamp-2 text-grey-500 text-xs">
																{block.description}
															</p>
														)}
													</div>
												</Link>
												<div className="flex items-center justify-between border-grey-200 border-t px-3 py-2">
													<code className="rounded bg-grey-100 px-1.5 py-0.5 font-mono text-grey-600 text-xs">
														{block.name}
													</code>
													<Link
														href={`/blocks/${block._id}?mode=edit`}
														className="font-medium text-primary text-xs hover:underline"
													>
														Edit →
													</Link>
												</div>
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				)}
			</div>

			{/* Fixed FAB - Create Block */}
			<Link
				href="/blocks/new"
				className="fixed right-6 bottom-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-white shadow-lg transition-all hover:bg-primary-800 hover:shadow-xl"
			>
				<Plus className="h-5 w-5" />
				Create Block
			</Link>

			{/* Image preview modal */}
			<Dialog
				open={!!previewBlock}
				onOpenChange={(open) => !open && setPreviewBlock(null)}
			>
				<DialogContent className="max-w-4xl overflow-hidden p-0">
					<DialogTitle className="sr-only">
						{previewBlock?.displayName} preview
					</DialogTitle>
					{previewBlock?.previewImage && (
						<div className="relative h-[75vh] w-full bg-grey-100">
							<CFImage
								assetId={previewBlock.previewImage}
								alt={previewBlock.displayName}
								fill
								variant="public"
								className="object-contain"
							/>
						</div>
					)}
					<div className="flex items-center justify-between bg-white px-4 py-3">
						<div className="flex items-center gap-2">
							{previewBlock?.icon && (
								<span className="text-lg">{previewBlock.icon}</span>
							)}
							<span className="font-semibold text-grey-900">
								{previewBlock?.displayName}
							</span>
							<code className="rounded bg-grey-100 px-2 py-0.5 font-mono text-grey-500 text-xs">
								{previewBlock?.name}
							</code>
						</div>
						<Link
							href={`/blocks/${previewBlock?._id}?mode=edit`}
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-800"
						>
							Edit →
						</Link>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
