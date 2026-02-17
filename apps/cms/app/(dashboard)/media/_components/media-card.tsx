"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared/src"
import { useAction } from "convex/react"

import {
	Check,
	Download,
	Edit2,
	File,
	FileArchive,
	FileAudio,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type MediaCardProps = {
	id: Id<"cmsMedia">
	cloudflareId: string
	caption: string
	tags: string[]
	width?: number
	height?: number
	size: number
	mimeType: string
	storageType?: string
	r2Key?: string
	onEdit?: () => void
	onDelete?: () => void
	onSelect?: () => void
	isSelected?: boolean
	selectionMode?: boolean
}

const getFileIcon = (mimeType: string) => {
	if (mimeType.startsWith("video/")) return FileVideo
	if (mimeType.startsWith("audio/")) return FileAudio
	if (mimeType.startsWith("text/")) return FileText
	if (
		mimeType === "application/pdf" ||
		mimeType === "application/msword" ||
		mimeType.includes("wordprocessingml")
	)
		return FileText
	if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
		return FileSpreadsheet
	if (
		mimeType.includes("zip") ||
		mimeType.includes("tar") ||
		mimeType.includes("gzip") ||
		mimeType.includes("rar")
	)
		return FileArchive
	if (
		mimeType.includes("javascript") ||
		mimeType.includes("json") ||
		mimeType.includes("xml") ||
		mimeType.includes("html")
	)
		return FileCode
	return File
}

const getFileExtension = (filename: string) => {
	const parts = filename.split(".")
	return parts.length > 1 ? parts.pop()?.toUpperCase() : ""
}

export function MediaCard({
	cloudflareId,
	caption,
	tags,
	width,
	height,
	size,
	mimeType,
	storageType,
	r2Key,
	onEdit,
	onDelete,
	onSelect,
	isSelected = false,
	selectionMode = false,
}: MediaCardProps) {
	const [isDownloading, setIsDownloading] = useState(false)
	const getFileUrl = useAction(api.cms.r2.getFileUrl)

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const isR2File = storageType === "r2"

	// Determine if the image is small (e.g. icons, thumbnails)
	const isSmallImage =
		!isR2File && width && height && width <= 200 && height <= 200

	const FileIcon = getFileIcon(mimeType)
	const fileExtension = getFileExtension(caption) || mimeType.split("/")[1]

	const handleDownload = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!r2Key || isDownloading) return

		setIsDownloading(true)
		try {
			const url = await getFileUrl({ key: r2Key })
			window.open(url, "_blank")
		} catch (error) {
			console.error("Download error:", error)
			toast.error("Error getting download URL")
		} finally {
			setIsDownloading(false)
		}
	}

	return (
		<div
			role="button"
			tabIndex={0}
			className={`group relative mb-4 break-inside-avoid overflow-hidden rounded-lg border bg-white shadow-sm transition-all ${
				isSelected
					? "border-primary ring-2 ring-primary/20"
					: "border-grey-200 hover:border-primary/50 hover:shadow-md"
			} ${selectionMode ? "cursor-pointer" : ""}`}
			onClick={selectionMode ? onSelect : undefined}
		>
			{/* Image or File Icon */}
			<div
				className={`relative overflow-hidden bg-grey-100 ${
					isR2File
						? "flex items-center justify-center py-8"
						: isSmallImage
							? "flex items-center justify-center p-6"
							: ""
				}`}
			>
				{isR2File ? (
					<div className="flex flex-col items-center gap-2">
						<FileIcon className="h-12 w-12 text-grey-400" />
						{fileExtension && (
							<span className="rounded bg-grey-200 px-2 py-0.5 font-medium text-grey-600 text-xs uppercase">
								{fileExtension}
							</span>
						)}
					</div>
				) : (
					<CFImage
						assetId={cloudflareId}
						alt={caption}
						width={isSmallImage ? width || 96 : 400}
						height={
							isSmallImage
								? height || 96
								: height && width
									? Math.round((400 * height) / width)
									: 300
						}
						variant="public"
						className={
							isSmallImage
								? "object-contain transition-transform group-hover:scale-105"
								: "h-auto w-full object-cover transition-transform group-hover:scale-105"
						}
						style={isSmallImage ? undefined : { maxHeight: "320px" }}
					/>
				)}

				{/* Selection Indicator */}
				{selectionMode && isSelected && (
					<div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
						<Check className="h-5 w-5" />
					</div>
				)}

				{/* Hover Overlay (only when not in selection mode) */}
				{!selectionMode && (
					<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
						{isR2File && r2Key && (
							<button
								type="button"
								onClick={handleDownload}
								disabled={isDownloading}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
								title="Download"
							>
								<Download className="h-4 w-4" />
							</button>
						)}
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
						{isR2File
							? mimeType.split("/")[1] || "file"
							: width && height
								? `${width}×${height}`
								: mimeType.split("/")[1]}
					</span>
					<span>{formatFileSize(size)}</span>
				</div>
			</div>
		</div>
	)
}
