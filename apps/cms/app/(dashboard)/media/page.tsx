"use client"

import { Plus, Tags } from "lucide-react"
import { useState } from "react"
import { MediaGallery } from "./_components/media-gallery"
import { MediaUploader } from "./_components/media-uploader"
import { TagManager } from "./_components/tag-manager"

export default function MediaPage() {
	const [showUploader, setShowUploader] = useState(false)
	const [showTagManager, setShowTagManager] = useState(false)

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Media Center</h1>
					<p className="mt-2 text-grey-500">
						Manage images and media files for your content
					</p>
				</div>
				<div className="flex gap-3">
					<button
						type="button"
						onClick={() => setShowTagManager(true)}
						className="inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-4 py-2 text-grey-500 transition-colors hover:bg-grey-100"
					>
						<Tags className="h-4 w-4" />
						Manage Tags
					</button>
				</div>
			</div>

			{/* Main Content */}
			<MediaGallery />

			{/* Floating Upload Button */}
			<button
				type="button"
				onClick={() => setShowUploader(true)}
				className="fixed right-8 bottom-8 z-10 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-white shadow-lg transition-colors hover:bg-primary-800"
			>
				<Plus className="h-5 w-5" />
				Upload Image
			</button>

			{/* Upload Dialog */}
			{showUploader && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
						<h2 className="mb-4 font-semibold text-lg">Upload New Image</h2>
						<MediaUploader
							onUploadComplete={() => setShowUploader(false)}
							onCancel={() => setShowUploader(false)}
							showInline
						/>
					</div>
				</div>
			)}

			{/* Tag Manager Dialog */}
			{showTagManager && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-2xl">
						<TagManager onClose={() => setShowTagManager(false)} />
					</div>
				</div>
			)}
		</div>
	)
}
