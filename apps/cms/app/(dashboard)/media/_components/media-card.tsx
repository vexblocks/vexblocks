"use client"

import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { Check, Edit2, Trash2 } from "lucide-react"

type MediaCardProps = {
	id: Id<"cmsMedia">
	cloudflareId: string
	caption: string
	tags: string[]
	width?: number
	height?: number
	size: number
	mimeType: string
	onEdit?: () => void
	onDelete?: () => void
	onSelect?: () => void
	isSelected?: boolean
	selectionMode?: boolean
}

export function MediaCard({
	cloudflareId,
	caption,
	tags,
	width,
	height,
	size,
	mimeType,
	onEdit,
	onDelete,
	onSelect,
	isSelected = false,
	selectionMode = false,
}: MediaCardProps) {
	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	return (
		<div
			role="button"
			tabIndex={0}
			className={`group relative mb-4 inline-block w-full break-inside-avoid overflow-hidden rounded-lg border bg-white shadow-sm transition-all ${
				isSelected
					? "border-primary ring-2 ring-primary/20"
					: "border-grey-200 hover:border-primary/50 hover:shadow-md"
			} ${selectionMode ? "cursor-pointer" : ""}`}
			onClick={selectionMode ? onSelect : undefined}
		>
			{/* Image */}
			<div
				className={`relative flex items-center justify-center overflow-hidden bg-grey-100 ${
					width && width < 200 ? "p-4" : ""
				}`}
			>
				<CFImage
					assetId={cloudflareId}
					alt={caption}
					width={width || 400}
					height={height || 400}
					variant="public"
					className={`max-w-full transition-transform group-hover:scale-105 ${
						width && width < 200 ? "h-auto w-auto" : "h-auto w-full"
					}`}
					style={
						width && height
							? { aspectRatio: `${width} / ${height}` }
							: undefined
					}
				/>

				{/* Selection Indicator */}
				{selectionMode && isSelected && (
					<div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
						<Check className="h-5 w-5" />
					</div>
				)}

				{/* Hover Overlay (only when not in selection mode) */}
				{!selectionMode && (
					<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							type="button"
							onClick={onEdit}
							className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white"
							title="Edit"
						>
							<Edit2 className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={onDelete}
							className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-error transition-colors hover:bg-error hover:text-white"
							title="Delete"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				)}
			</div>

			{/* Info */}
			<div className="p-3">
				<h3 className="truncate font-medium text-grey-900 text-sm">
					{caption}
				</h3>

				{/* Tags */}
				{tags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						{tags.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs"
							>
								{tag}
							</span>
						))}
						{tags.length > 3 && (
							<span className="rounded-full bg-grey-100 px-2 py-0.5 text-grey-500 text-xs">
								+{tags.length - 3}
							</span>
						)}
					</div>
				)}

				{/* Meta Info */}
				<div className="mt-2 flex items-center justify-between text-grey-500 text-xs">
					<span>
						{width && height ? `${width}×${height}` : mimeType.split("/")[1]}
					</span>
					<span>{formatFileSize(size)}</span>
				</div>
			</div>
		</div>
	)
}
