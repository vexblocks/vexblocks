"use client"

import { useUploadFile } from "@convex-dev/r2/react"
import { useAtom } from "@lfades/atom"
import { useMutation, useQuery } from "convex/react"
import { FileUp, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authAtom } from "@/lib/auth-atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

type FileUploaderProps = {
	onUploadComplete?: (media: { id: Id<"cmsMedia"> }) => void
	onCancel?: () => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUploader({
	onUploadComplete,
	onCancel,
}: FileUploaderProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [file, setFile] = useState<File | null>(null)
	const [caption, setCaption] = useState("")
	const [tags, setTags] = useState<string[]>([])
	const [uploadProgress, setUploadProgress] = useState(0)

	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const uploadFile = useUploadFile(api.cms.r2)
	const createMedia = useMutation(api.cms.media.create)
	const availableTags = useQuery(api.cms.mediaTags.list, isReady ? {} : "skip")

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (!selectedFile) return

		// Reject image files — those should use Cloudflare Images via "Upload Image"
		if (selectedFile.type.startsWith("image/")) {
			toast.error(
				'Image files should be uploaded using the "Upload Image" button',
			)
			e.target.value = ""
			return
		}

		if (selectedFile.size > MAX_FILE_SIZE) {
			toast.error("File size must be less than 50MB")
			return
		}

		setFile(selectedFile)

		// Auto-fill caption from filename (without extension)
		if (!caption) {
			const filenameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
			setCaption(filenameWithoutExt)
		}
	}

	const handleToggleTag = (tagName: string) => {
		if (tags.includes(tagName)) {
			setTags(tags.filter((tag) => tag !== tagName))
		} else {
			setTags([...tags, tagName])
		}
	}

	const handleUpload = async () => {
		if (!file || !caption.trim()) {
			toast.error("Please select a file and provide a caption")
			return
		}

		setIsUploading(true)
		setUploadProgress(0)

		try {
			// Upload to R2
			const r2Key = await uploadFile(file, {
				onProgress: ({ loaded, total }) => {
					setUploadProgress(Math.round((loaded / total) * 100))
				},
			})

			// Save metadata to Convex
			const mediaId = await createMedia({
				cloudflareId: "", // No Cloudflare Images ID for R2 files
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				size: file.size,
				caption: caption.trim(),
				tags: tags.length > 0 ? tags : undefined,
				storageType: "r2",
				r2Key,
			})

			toast.success("File uploaded successfully!")

			// Reset form
			setFile(null)
			setCaption("")
			setTags([])
			setUploadProgress(0)

			onUploadComplete?.({ id: mediaId })
		} catch (error) {
			console.error("Upload error:", error)
			toast.error("Error uploading file")
		} finally {
			setIsUploading(false)
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	return (
		<div className="space-y-4">
			{/* File Upload */}
			<div>
				<div className="mb-2 block text-sm font-medium text-grey-500">
					File <span className="text-error">*</span>
				</div>
				<div className="flex items-center gap-4">
					<label
						htmlFor="file-upload-r2"
						className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-grey-300 px-4 py-3 transition-colors hover:border-primary"
					>
						<FileUp className="h-5 w-5 text-grey-500" />
						<span className="text-sm text-grey-500">
							{file ? file.name : "Choose a file..."}
						</span>
					</label>
					<input
						id="file-upload-r2"
						type="file"
						className="hidden"
						accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.json,.xml,.zip,.rar,.7z,.tar,.gz,.mp4,.mov,.avi,.webm,.mkv,.mp3,.wav,.ogg,.flac,.aac,.svg,.md,.html,.css,.js,.ts"
						onChange={handleFileChange}
						disabled={isUploading}
					/>
				</div>
				{file && (
					<p className="mt-1 text-xs text-grey-400">
						{file.type || "Unknown type"} - {formatFileSize(file.size)}
					</p>
				)}
			</div>

			{/* Upload Progress */}
			{isUploading && uploadProgress > 0 && (
				<div className="space-y-1">
					<div className="h-2 w-full overflow-hidden rounded-full bg-grey-200">
						<div
							className="h-full rounded-full bg-primary transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
					<p className="text-xs text-grey-500">{uploadProgress}% uploaded</p>
				</div>
			)}

			{/* Caption */}
			<div>
				<label
					htmlFor="caption-r2"
					className="mb-2 block text-sm font-medium text-grey-500"
				>
					Caption / Name <span className="text-error">*</span>
				</label>
				<input
					id="caption-r2"
					type="text"
					value={caption}
					onChange={(e) => setCaption(e.target.value)}
					placeholder="Descriptive name for this file"
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					disabled={isUploading}
				/>
			</div>

			{/* Tags */}
			<div>
				<p className="mb-2 block text-sm font-medium text-grey-500">Tags</p>
				{!availableTags || availableTags.length === 0 ? (
					<p className="text-sm text-grey-400">
						No tags available. Create tags in the "Manage Tags" dialog first.
					</p>
				) : (
					<div className="space-y-2">
						{availableTags.map((tag) => (
							<label
								key={tag._id}
								htmlFor={`tag-r2-${tag._id}`}
								className="hover:bg-grey-50 flex cursor-pointer items-center gap-2 rounded-lg border border-grey-200 px-4 py-2 transition-colors"
							>
								<input
									id={`tag-r2-${tag._id}`}
									type="checkbox"
									checked={tags.includes(tag.name)}
									onChange={() => handleToggleTag(tag.name)}
									disabled={isUploading}
									className="h-4 w-4 rounded border-grey-300 text-primary transition-colors focus:ring-2 focus:ring-primary/20"
								/>
								<span className="text-sm text-grey-500">{tag.name}</span>
								{tag.usageCount > 0 && (
									<span className="ml-auto text-xs text-grey-400">
										{tag.usageCount} {tag.usageCount === 1 ? "use" : "uses"}
									</span>
								)}
							</label>
						))}
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						disabled={isUploading}
						className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
					>
						Cancel
					</button>
				)}
				<button
					type="button"
					onClick={handleUpload}
					disabled={isUploading || !file || !caption.trim()}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
				>
					<Upload className="h-4 w-4" />
					{isUploading ? "Uploading..." : "Upload File"}
				</button>
			</div>
		</div>
	)
}
