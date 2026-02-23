"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import Compressor from "compressorjs"
import { useMutation, useQuery } from "convex/react"
import { CheckCircle2, Loader2, Upload, X, XCircle } from "lucide-react"
import { nanoid } from "nanoid"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { authAtom } from "@/lib/auth-atom"

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

const ACCEPTED_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/webp",
	"image/avif",
	"image/gif",
])

type QueuedImage = {
	localId: string
	file: File
	previewUrl: string
	caption: string
	status: "pending" | "uploading" | "done" | "error"
}

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

function buildQueueItem(file: File): QueuedImage {
	return {
		localId: nanoid(),
		file,
		previewUrl: URL.createObjectURL(file),
		caption: file.name.replace(/\.[^/.]+$/, ""),
		status: "pending",
	}
}

function compressImage(file: File): Promise<Blob> {
	return new Promise((resolve, reject) => {
		new Compressor(file, {
			quality: 0.8,
			maxWidth: 1600,
			mimeType: "image/jpeg",
			success: resolve,
			error: reject,
		})
	})
}

function getDimensions(
	url: string,
): Promise<{ width?: number; height?: number }> {
	return new Promise((resolve) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.width, height: img.height })
		img.onerror = () => resolve({})
		img.src = url
	})
}

async function getFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
	if (entry.isFile) {
		return new Promise((resolve) => {
			;(entry as FileSystemFileEntry).file(
				(f) => resolve([f]),
				() => resolve([]),
			)
		})
	}
	if (entry.isDirectory) {
		const reader = (entry as FileSystemDirectoryEntry).createReader()
		const allEntries: FileSystemEntry[] = []
		await new Promise<void>((resolve) => {
			const readBatch = () => {
				reader.readEntries(
					(batch) => {
						if (batch.length === 0) {
							resolve()
						} else {
							allEntries.push(...batch)
							readBatch()
						}
					},
					() => resolve(),
				)
			}
			readBatch()
		})
		const nested = await Promise.all(allEntries.map(getFilesFromEntry))
		return nested.flat()
	}
	return []
}

export function MediaUploader({
	onUploadComplete,
	onCancel,
	showInline = false,
	prefilledTags = [],
}: MediaUploaderProps) {
	const [queue, setQueue] = useState<QueuedImage[]>([])
	const [tags, setTags] = useState<string[]>(prefilledTags)
	const [isUploading, setIsUploading] = useState(false)
	const [isDragging, setIsDragging] = useState(false)

	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const createMedia = useMutation(api.cms.media.create)
	const availableTags = useQuery(api.cms.mediaTags.list, isReady ? {} : "skip")

	const uploadableCount = queue.filter(
		(q) => q.status === "pending" || q.status === "error",
	).length

	const addFiles = useCallback((files: File[]) => {
		const valid: File[] = []
		for (const f of files) {
			if (!ACCEPTED_IMAGE_TYPES.has(f.type)) continue
			if (f.size > MAX_IMAGE_SIZE) {
				toast.warning(`"${f.name}" exceeds 10MB and was skipped`)
				continue
			}
			valid.push(f)
		}
		if (valid.length > 0) {
			setQueue((prev) => [...prev, ...valid.map(buildQueueItem)])
		}
	}, [])

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		addFiles(Array.from(e.target.files || []))
		e.target.value = ""
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDragging(false)
		}
	}

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)

		const files: File[] = []
		for (const item of Array.from(e.dataTransfer.items)) {
			if (item.kind !== "file") continue
			const entry = item.webkitGetAsEntry()
			if (entry) {
				files.push(...(await getFilesFromEntry(entry)))
			}
		}
		addFiles(files)
	}

	const removeFromQueue = (localId: string) => {
		setQueue((prev) => {
			const item = prev.find((q) => q.localId === localId)
			if (item) URL.revokeObjectURL(item.previewUrl)
			return prev.filter((q) => q.localId !== localId)
		})
	}

	const updateCaption = (localId: string, caption: string) => {
		setQueue((prev) =>
			prev.map((q) => (q.localId === localId ? { ...q, caption } : q)),
		)
	}

	const handleToggleTag = (tagName: string) => {
		setTags((prev) =>
			prev.includes(tagName)
				? prev.filter((t) => t !== tagName)
				: [...prev, tagName],
		)
	}

	const handleUpload = async () => {
		// Error items are retried automatically
		const toUpload = queue.filter(
			(q) => q.status === "pending" || q.status === "error",
		)
		if (toUpload.length === 0) return

		// Reset errors to pending before starting
		setQueue((prev) =>
			prev.map((q) => (q.status === "error" ? { ...q, status: "pending" } : q)),
		)

		setIsUploading(true)
		let successCount = 0
		let failCount = 0
		let lastUploadedMedia:
			| { id: Id<"cmsMedia">; cloudflareId: string }
			| undefined

		for (const item of toUpload) {
			setQueue((prev) =>
				prev.map((q) =>
					q.localId === item.localId ? { ...q, status: "uploading" } : q,
				),
			)

			try {
				const fileToUpload =
					item.file.type === "image/gif"
						? item.file
						: await compressImage(item.file)

				const response = await fetch("/api/get-cf-url", {
					method: "POST",
				}).then((r) => r.json())

				if (!response?.result?.uploadURL) {
					throw new Error("Failed to get upload URL from Cloudflare")
				}

				const formData = new FormData()
				formData.set("file", fileToUpload, `cms-${nanoid()}`)

				const upload = await fetch(response.result.uploadURL, {
					method: "POST",
					body: formData,
				}).then((r) => r.json())

				if (!upload?.result?.id) {
					throw new Error("Failed to upload to Cloudflare")
				}

				const cloudflareId = upload.result.id
				const dimensions = await getDimensions(item.previewUrl)

				const mediaId = await createMedia({
					cloudflareId,
					filename: item.file.name,
					mimeType: item.file.type,
					size: item.file.size,
					width: dimensions.width,
					height: dimensions.height,
					caption: item.caption.trim() || item.file.name,
					tags: tags.length > 0 ? tags : undefined,
				})

				lastUploadedMedia = { id: mediaId, cloudflareId }

				setQueue((prev) =>
					prev.map((q) =>
						q.localId === item.localId ? { ...q, status: "done" } : q,
					),
				)
				successCount++
			} catch (error) {
				console.error("Upload error:", error)
				setQueue((prev) =>
					prev.map((q) =>
						q.localId === item.localId ? { ...q, status: "error" } : q,
					),
				)
				failCount++
			}
		}

		setIsUploading(false)

		if (successCount > 0) {
			toast.success(
				`${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully!`,
			)
		}
		if (failCount > 0) {
			toast.error(
				`${failCount} image${failCount > 1 ? "s" : ""} failed. You can retry them.`,
			)
		}

		// Auto-close only when everything succeeded
		if (failCount === 0 && lastUploadedMedia) {
			onUploadComplete?.(lastUploadedMedia)
		}
	}

	const buttonLabel = isUploading
		? "Uploading..."
		: uploadableCount > 1
			? `Upload Images (${uploadableCount})`
			: "Upload Image"

	return (
		<div className={showInline ? "" : "rounded-lg bg-white p-6 shadow-md"}>
			<div className="space-y-4">
				{/* Hidden file input */}
				<input
					id="media-uploader-input"
					type="file"
					className="hidden"
					accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
					multiple
					onChange={handleFileInputChange}
					disabled={isUploading}
				/>

				{/* Drop zone — label opens the file dialog on click */}
				<label
					htmlFor="media-uploader-input"
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
						isDragging
							? "border-primary bg-primary/5"
							: "border-grey-300 hover:border-primary"
					} ${queue.length > 0 ? "py-4" : "py-10"} ${isUploading ? "pointer-events-none opacity-60" : ""}`}
				>
					<Upload
						className={`mb-2 text-grey-400 ${queue.length > 0 ? "h-6 w-6" : "h-10 w-10"}`}
					/>
					<p className="font-medium text-grey-500 text-sm">
						{isDragging
							? "Drop images here"
							: "Drag images or a folder here, or click to browse"}
					</p>
					{!isDragging && (
						<p className="mt-1 text-grey-400 text-xs">
							PNG, JPEG, WebP, AVIF, GIF — max 10 MB each
						</p>
					)}
				</label>

				{/* Queue */}
				{queue.length > 0 && (
					<div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-grey-200 p-2">
						{queue.map((item) => (
							<div
								key={item.localId}
								className={`flex items-center gap-3 rounded-md p-2 ${
									item.status === "error" ? "bg-error/5" : "bg-grey-50"
								}`}
							>
								{/* Thumbnail */}
								{/* biome-ignore lint/performance/noImgElement: blob URL preview */}
								<img
									src={item.previewUrl}
									alt=""
									className="h-12 w-12 shrink-0 rounded object-cover"
								/>

								{/* Caption */}
								<input
									type="text"
									value={item.caption}
									onChange={(e) => updateCaption(item.localId, e.target.value)}
									disabled={
										item.status === "uploading" || item.status === "done"
									}
									placeholder="Caption..."
									className="min-w-0 flex-1 rounded border border-grey-200 bg-white px-2 py-1 text-grey-700 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-grey-100 disabled:text-grey-400"
								/>

								{/* Status icon */}
								<div className="shrink-0">
									{item.status === "uploading" && (
										<Loader2 className="h-5 w-5 animate-spin text-primary" />
									)}
									{item.status === "done" && (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									)}
									{item.status === "error" && (
										<XCircle className="h-5 w-5 text-error" />
									)}
								</div>

								{/* Remove / spacer */}
								{item.status === "pending" || item.status === "error" ? (
									<button
										type="button"
										onClick={() => removeFromQueue(item.localId)}
										disabled={isUploading}
										className="shrink-0 rounded p-1 text-grey-400 transition-colors hover:bg-grey-200 hover:text-grey-700 disabled:opacity-50"
										title="Remove"
									>
										<X className="h-4 w-4" />
									</button>
								) : (
									<div className="w-6 shrink-0" />
								)}
							</div>
						))}
					</div>
				)}

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
						disabled={isUploading || uploadableCount === 0}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						<Upload className="h-4 w-4" />
						{buttonLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
