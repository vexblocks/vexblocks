"use client"

import { Upload as UploadIcon, X } from "lucide-react"
import { useRef, useState } from "react"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { FileUploader } from "./file-uploader"
import { MediaGallery } from "./media-gallery"
import { MediaUploader } from "./media-uploader"

type MediaSelectorProps = {
	onSelect: (media: { id: Id<"cmsMedia">; cloudflareId: string }) => void
	onClose: () => void
	selectedCloudflareId?: string
	filterType?: "all" | "images" | "files"
}

export function MediaSelector({
	onSelect,
	onClose,
	selectedCloudflareId,
	filterType = "all",
}: MediaSelectorProps) {
	const [view, setView] = useState<"gallery" | "upload">("gallery")
	const scrollContainerRef = useRef<HTMLDivElement | null>(null)

	const isFilesOnly = filterType === "files"

	const handleSelect = (media: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => {
		onSelect(media)
		onClose()
	}

	const handleUploadComplete = (media?: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => {
		if (media) {
			handleSelect(media)
		} else {
			// Multiple images uploaded — go to gallery so the user can pick one
			setView("gallery")
		}
	}

	const handleFileUploadComplete = (media: { id: Id<"cmsMedia"> }) => {
		// For R2 files, cloudflareId is empty — pass the media id instead
		onSelect({ id: media.id, cloudflareId: "" })
		onClose()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-grey-200 bg-white px-6 py-4">
					<div className="flex items-center gap-4">
						<h2 className="text-xl font-semibold text-primary">
							{isFilesOnly ? "Select File" : "Select Media"}
						</h2>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setView("gallery")}
								className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
									view === "gallery"
										? "bg-primary text-white"
										: "text-grey-700 bg-grey-100 hover:bg-grey-200"
								}`}
							>
								{isFilesOnly ? "File Library" : "Media Library"}
							</button>
							<button
								type="button"
								onClick={() => setView("upload")}
								className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
									view === "upload"
										? "bg-primary text-white"
										: "text-grey-700 bg-grey-100 hover:bg-grey-200"
								}`}
							>
								<UploadIcon className="h-4 w-4" />
								Upload New
							</button>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="hover:text-grey-700 text-grey-500 transition-colors"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Content */}
				<div
					ref={scrollContainerRef}
					className="bg-grey-50 flex-1 overflow-y-auto p-6"
				>
					{view === "gallery" ? (
						<MediaGallery
							selectionMode
							onSelect={handleSelect}
							selectedCloudflareId={selectedCloudflareId}
							filterType={filterType}
							scrollContainerRef={scrollContainerRef}
						/>
					) : isFilesOnly ? (
						<FileUploader
							onUploadComplete={handleFileUploadComplete}
							onCancel={() => setView("gallery")}
						/>
					) : (
						<MediaUploader
							onUploadComplete={handleUploadComplete}
							onCancel={() => setView("gallery")}
							showInline
						/>
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-grey-200 bg-white px-6 py-4">
					<div className="flex items-center justify-between text-sm text-grey-500">
						<p>
							{view === "gallery"
								? isFilesOnly
									? "Click on a file to select it"
									: "Click on an image to select it"
								: isFilesOnly
									? "Upload a new file and it will be automatically selected"
									: "Upload a new image and it will be automatically selected"}
						</p>
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
