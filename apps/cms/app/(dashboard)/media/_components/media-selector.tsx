"use client"

import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Upload as UploadIcon, X } from "lucide-react"
import { useState } from "react"
import { MediaGallery } from "./media-gallery"
import { MediaUploader } from "./media-uploader"

type MediaSelectorProps = {
	onSelect: (media: { id: Id<"cmsMedia">; cloudflareId: string }) => void
	onClose: () => void
	selectedCloudflareId?: string
}

export function MediaSelector({
	onSelect,
	onClose,
	selectedCloudflareId,
}: MediaSelectorProps) {
	const [view, setView] = useState<"gallery" | "upload">("gallery")

	const handleSelect = (media: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => {
		onSelect(media)
		onClose()
	}

	const handleUploadComplete = (media: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => {
		// After upload, select the newly uploaded image
		handleSelect(media)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-grey-200 border-b bg-white px-6 py-4">
					<div className="flex items-center gap-4">
						<h2 className="font-semibold text-primary text-xl">Select Media</h2>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setView("gallery")}
								className={`rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
									view === "gallery"
										? "bg-primary text-white"
										: "bg-grey-100 text-grey-700 hover:bg-grey-200"
								}`}
							>
								Media Library
							</button>
							<button
								type="button"
								onClick={() => setView("upload")}
								className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
									view === "upload"
										? "bg-primary text-white"
										: "bg-grey-100 text-grey-700 hover:bg-grey-200"
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
						className="text-grey-500 transition-colors hover:text-grey-700"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto bg-grey-50 p-6">
					{view === "gallery" ? (
						<MediaGallery
							selectionMode
							onSelect={handleSelect}
							selectedCloudflareId={selectedCloudflareId}
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
				<div className="border-grey-200 border-t bg-white px-6 py-4">
					<div className="flex items-center justify-between text-grey-500 text-sm">
						<p>
							{view === "gallery"
								? "Click on an image to select it"
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
