"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { Layers, Plus } from "lucide-react"
import Link from "next/link"

export default function BlocksPage() {
	const blocks = useQuery(api.cms.blocks.list)

	if (blocks === undefined) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading blocks...</p>
				</div>
			</div>
		)
	}

	if (blocks === null) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
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
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-primary">Reusable Blocks</h1>
					<p className="mt-2 text-grey-500">
						Create and manage reusable components for your content
					</p>
				</div>
				<Link
					href="/blocks/new"
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-white transition-colors hover:bg-primary-800"
				>
					<Plus className="h-4 w-4" />
					Create Block
				</Link>
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
				<div className="space-y-8">
					{Object.entries(categorizedBlocks).map(
						([category, categoryBlocks]) => (
							<div key={category}>
								<h2 className="mb-4 font-semibold text-grey-700 text-xl">
									{category}
								</h2>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
															className="object-cover transition-transform group-hover:scale-105"
														/>
													</div>
												) : (
													<div className="flex h-32 w-full items-center justify-center bg-grey-50">
														<Layers className="h-12 w-12 text-grey-300" />
													</div>
												)}
												<div className="p-4">
													<div className="mb-2 flex items-center gap-2">
														{block.icon && (
															<span className="text-lg">{block.icon}</span>
														)}
														<h3 className="font-semibold text-grey-900 text-lg group-hover:text-primary">
															{block.displayName}
														</h3>
													</div>
													<p className="mb-2 text-grey-400 text-xs">
														{block.fields.length} field
														{block.fields.length !== 1 ? "s" : ""}
													</p>
													{block.description && (
														<p className="line-clamp-2 text-grey-500 text-sm">
															{block.description}
														</p>
													)}
												</div>
											</Link>
											<div className="flex items-center justify-between border-grey-200 border-t px-4 py-3">
												<code className="rounded bg-grey-100 px-2 py-1 font-mono text-grey-600 text-xs">
													{block.name}
												</code>
												<Link
													href={`/blocks/${block._id}?mode=edit`}
													className="font-medium text-primary text-sm hover:underline"
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
	)
}
