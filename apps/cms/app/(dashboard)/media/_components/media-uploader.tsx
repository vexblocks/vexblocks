"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import Compressor from "compressorjs"
import { useMutation, useQuery } from "convex/react"
import { Upload } from "lucide-react"
import { nanoid } from "nanoid"
import { useState } from "react"
import { toast } from "sonner"
import { authAtom } from "@/lib/auth-atom"

type MediaUploaderProps = {
	onUploadComplete?: (media: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => void
	onCancel?: () => void
	showInline?: boolean
	prefilledCaption?: string
	prefilledTags?: string[]
}

export function MediaUploader({
	onUploadComplete,
	onCancel,
	showInline = false,
	prefilledCaption = "",
	prefilledTags = [],
}: MediaUploaderProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [file, setFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [caption, setCaption] = useState(prefilledCaption)
	const [alt, setAlt] = useState("")
	const [tags, setTags] = useState<string[]>(prefilledTags)

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const createMedia = useMutation(api.cms.media.create)
	const availableTags = useQuery(api.cms.mediaTags.list, isReady ? {} : "skip")

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (!selectedFile) return

		// Validate file type
		if (!selectedFile.type.startsWith("image/")) {
			toast.error("Please select an image file")
			return
		}

		// Validate file size (10MB limit)
		if (selectedFile.size > 10 * 1024 * 1024) {
			toast.error("File size must be less than 10MB")
			return
		}

		setFile(selectedFile)

		// Create preview
		const reader = new FileReader()
		reader.onloadend = () => {
			setPreviewUrl(reader.result as string)
		}
		reader.readAsDataURL(selectedFile)

		// Auto-fill caption with filename (without extension)
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

		try {
			const isGif = file.type === "image/gif"

			const uploadToCloudflare = async (fileToUpload: File | Blob) => {
				// Get Cloudflare upload URL
				const response = await fetch("/api/get-cf-url", {
					method: "POST",
				}).then((res) => res.json())

				if (!response?.result?.uploadURL) {
					throw new Error("Failed to get upload URL from Cloudflare")
				}

				// Upload file to Cloudflare
				const formData = new FormData()
				formData.set("file", fileToUpload, `cms-${nanoid()}`)

				const upload = await fetch(response.result.uploadURL, {
					method: "POST",
					body: formData,
				}).then((res) => res.json())

				if (!upload?.result?.id) {
					throw new Error("Failed to upload to Cloudflare")
				}

				const cloudflareId = upload.result.id

				// Get image dimensions if available
				const img = new Image()
				const dimensions = await new Promise<{
					width?: number
					height?: number
				}>((resolve) => {
					img.onload = () => {
						resolve({ width: img.width, height: img.height })
					}
					img.onerror = () => {
						resolve({})
					}
					img.src = previewUrl || ""
				})

				// Save metadata to Convex
				const mediaId = await createMedia({
					cloudflareId,
					filename: file.name,
					mimeType: file.type,
					size: file.size,
					width: dimensions.width,
					height: dimensions.height,
					caption: caption.trim(),
					alt: alt.trim() || undefined,
					tags: tags.length > 0 ? tags : undefined,
				})

				toast.success("Image uploaded successfully!")

				// Reset form
				setFile(null)
				setPreviewUrl(null)
				setCaption("")
				setAlt("")
				setTags([])

				onUploadComplete?.({ id: mediaId, cloudflareId })
			}

			if (isGif) {
				// If it's a GIF, upload directly without compression
				await uploadToCloudflare(file)
			} else {
				// For other image types, use Compressor
				new Compressor(file, {
					quality: 0.8,
					maxWidth: 1600,
					mimeType: "image/jpeg",
					success: async (compressedFile) => {
						try {
							await uploadToCloudflare(compressedFile)
						} catch (error) {
							console.error("Upload error:", error)
							toast.error("Error uploading image")
						} finally {
							setIsUploading(false)
						}
					},
					error(err) {
						console.error("Compression error:", err.message)
						toast.error("Error compressing image")
						setIsUploading(false)
					},
				})
				return // Early return for non-GIF files to avoid setting isUploading(false) twice
			}
		} catch (error) {
			console.error("Upload error:", error)
			toast.error("Error uploading image")
		} finally {
			// Only set to false for GIF files (non-GIF files handle this in the Compressor callbacks)
			if (file.type === "image/gif") {
				setIsUploading(false)
			}
		}
	}

	return (
		<div className={`${showInline ? "" : "rounded-lg bg-white p-6 shadow-md"}`}>
			<div className="space-y-4">
				{/* File Upload */}
				<div>
					<div className="mb-2 block font-medium text-grey-500 text-sm">
						Image File <span className="text-error">*</span>
					</div>
					<div className="flex items-center gap-4">
						<label
							htmlFor="file-upload"
							className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-grey-300 border-dashed px-4 py-3 transition-colors hover:border-primary"
						>
							<Upload className="h-5 w-5 text-grey-500" />
							<span className="text-grey-500 text-sm">
								{file ? file.name : "Choose an image..."}
							</span>
						</label>
						<input
							id="file-upload"
							type="file"
							className="hidden"
							accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
							onChange={handleFileChange}
							disabled={isUploading}
						/>
					</div>
				</div>

				{/* Preview */}
				{previewUrl && (
					<div className="rounded-lg border border-grey-300 p-4">
						{/* biome-ignore lint/performance/noImgElement: Preview uses blob URL which requires native img element */}
						<img
							src={previewUrl}
							alt="Preview"
							className="h-auto max-h-64 w-auto rounded"
						/>
					</div>
				)}

				{/* Caption */}
				<div>
					<label
						htmlFor="caption"
						className="mb-2 block font-medium text-grey-500 text-sm"
					>
						Caption / Name <span className="text-error">*</span>
					</label>
					<input
						id="caption"
						type="text"
						value={caption}
						onChange={(e) => setCaption(e.target.value)}
						placeholder="Descriptive name for this image"
						className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						disabled={isUploading}
					/>
				</div>

				{/* Alt Text */}
				<div>
					<label
						htmlFor="alt"
						className="mb-2 block font-medium text-grey-500 text-sm"
					>
						Alt Text (for accessibility)
					</label>
					<input
						id="alt"
						type="text"
						value={alt}
						onChange={(e) => setAlt(e.target.value)}
						placeholder="Describe the image for screen readers"
						className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						disabled={isUploading}
					/>
				</div>

				{/* Tags */}
				<div>
					<p className="mb-2 block font-medium text-grey-500 text-sm">Tags</p>
					{!availableTags || availableTags.length === 0 ? (
						<p className="text-grey-400 text-sm">
							No tags available. Create tags in the "Manage Tags" dialog first.
						</p>
					) : (
						<div className="space-y-2">
							{availableTags.map((tag) => (
								<label
									key={tag._id}
									htmlFor={`tag-${tag._id}`}
									className="flex cursor-pointer items-center gap-2 rounded-lg border border-grey-200 px-4 py-2 transition-colors hover:bg-grey-50"
								>
									<input
										id={`tag-${tag._id}`}
										type="checkbox"
										checked={tags.includes(tag.name)}
										onChange={() => handleToggleTag(tag.name)}
										disabled={isUploading}
										className="h-4 w-4 rounded border-grey-300 text-primary transition-colors focus:ring-2 focus:ring-primary/20"
									/>
									<span className="text-grey-500 text-sm">{tag.name}</span>
									{tag.usageCount > 0 && (
										<span className="ml-auto text-grey-400 text-xs">
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
						{isUploading ? "Uploading..." : "Upload Image"}
					</button>
				</div>
			</div>
		</div>
	)
}
