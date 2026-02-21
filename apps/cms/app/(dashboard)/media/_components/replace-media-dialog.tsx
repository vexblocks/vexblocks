"use client"

import { useUploadFile } from "@convex-dev/r2/react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import Compressor from "compressorjs"
import { useMutation } from "convex/react"
import { RefreshCw, Upload } from "lucide-react"
import { nanoid } from "nanoid"
import { useState } from "react"
import { toast } from "sonner"

type ReplaceMediaDialogProps = {
	mediaId: Id<"cmsMedia">
	storageType?: string
	currentCaption: string
	onClose: () => void
	onReplaced: () => void
}

export function ReplaceMediaDialog({
	mediaId,
	storageType,
	currentCaption,
	onClose,
	onReplaced,
}: ReplaceMediaDialogProps) {
	const [file, setFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [isReplacing, setIsReplacing] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)

	const isR2 = storageType === "r2"

	const replaceMedia = useMutation(api.cms.media.replace)
	const uploadFile = useUploadFile(api.cms.r2)

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (!selectedFile) return

		if (isR2) {
			if (selectedFile.type.startsWith("image/")) {
				toast.error('Image files should be uploaded using the "Upload Image" button')
				e.target.value = ""
				return
			}
			if (selectedFile.size > 50 * 1024 * 1024) {
				toast.error("File size must be less than 50MB")
				return
			}
		} else {
			if (!selectedFile.type.startsWith("image/")) {
				toast.error("Please select an image file")
				return
			}
			if (selectedFile.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB")
				return
			}
			const reader = new FileReader()
			reader.onloadend = () => setPreviewUrl(reader.result as string)
			reader.readAsDataURL(selectedFile)
		}

		setFile(selectedFile)
	}

	const handleReplace = async () => {
		if (!file) return
		setIsReplacing(true)
		setUploadProgress(0)

		if (isR2) {
			try {
				const r2Key = await uploadFile(file, {
					onProgress: ({ loaded, total }) => {
						setUploadProgress(Math.round((loaded / total) * 100))
					},
				})
				await replaceMedia({
					id: mediaId,
					filename: file.name,
					mimeType: file.type || "application/octet-stream",
					size: file.size,
					r2Key,
				})
				toast.success("File replaced successfully!")
				onReplaced()
			} catch (error) {
				console.error("Replace error:", error)
				toast.error("Error replacing file")
				setIsReplacing(false)
			}
			return
		}

		// Cloudflare Images upload
		const isGif = file.type === "image/gif"

		const uploadToCloudflare = async (fileToUpload: File | Blob) => {
			const response = await fetch("/api/get-cf-url", { method: "POST" }).then(
				(r) => r.json(),
			)
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

			const img = new Image()
			const dimensions = await new Promise<{ width?: number; height?: number }>(
				(resolve) => {
					img.onload = () => resolve({ width: img.width, height: img.height })
					img.onerror = () => resolve({})
					img.src = previewUrl || ""
				},
			)

			await replaceMedia({
				id: mediaId,
				filename: file.name,
				mimeType: file.type,
				size: file.size,
				width: dimensions.width,
				height: dimensions.height,
				cloudflareId,
			})

			toast.success("Image replaced successfully!")
			onReplaced()
		}

		if (isGif) {
			try {
				await uploadToCloudflare(file)
			} catch (error) {
				console.error("Replace error:", error)
				toast.error("Error replacing image")
			} finally {
				setIsReplacing(false)
			}
		} else {
			new Compressor(file, {
				quality: 0.8,
				maxWidth: 1600,
				mimeType: "image/jpeg",
				success: async (compressedFile) => {
					try {
						await uploadToCloudflare(compressedFile)
					} catch (error) {
						console.error("Replace error:", error)
						toast.error("Error replacing image")
					} finally {
						setIsReplacing(false)
					}
				},
				error(err) {
					console.error("Compression error:", err.message)
					toast.error("Error compressing image")
					setIsReplacing(false)
				},
			})
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
				<h3 className="mb-1 font-semibold text-lg text-primary">
					Replace {isR2 ? "File" : "Image"}
				</h3>
				<p className="mb-4 text-grey-500 text-sm">
					Current:{" "}
					<span className="font-medium text-grey-900">{currentCaption}</span>
				</p>

				<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 text-sm">
					The existing file will be permanently deleted from Cloudflare after
					replacement.
					{!isR2 &&
						" All content references to this image will be updated automatically."}
				</div>

				<div className="space-y-4">
					{/* File input */}
					<div>
						<div className="mb-2 block font-medium text-grey-500 text-sm">
							New {isR2 ? "File" : "Image"}{" "}
							<span className="text-error">*</span>
						</div>
						<div className="flex items-center gap-4">
							<label
								htmlFor="replace-file-input"
								className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-grey-300 border-dashed px-4 py-3 transition-colors hover:border-primary"
							>
								<Upload className="h-5 w-5 text-grey-500" />
								<span className="text-grey-500 text-sm">
									{file ? file.name : `Choose ${isR2 ? "a file" : "an image"}...`}
								</span>
							</label>
							<input
								id="replace-file-input"
								type="file"
								className="hidden"
								accept={
									isR2
										? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.json,.xml,.zip,.rar,.7z,.tar,.gz,.mp4,.mov,.avi,.webm,.mkv,.mp3,.wav,.ogg,.flac,.aac,.svg,.md,.html,.css,.js,.ts"
										: "image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
								}
								onChange={handleFileChange}
								disabled={isReplacing}
							/>
						</div>
						{file && (
							<p className="mt-1 text-grey-400 text-xs">
								{file.type || "Unknown type"} — {formatFileSize(file.size)}
							</p>
						)}
					</div>

					{/* Image preview */}
					{!isR2 && previewUrl && (
						<div className="rounded-lg border border-grey-300 p-4">
							{/* biome-ignore lint/performance/noImgElement: Preview uses blob URL */}
							<img
								src={previewUrl}
								alt="Preview"
								className="h-auto max-h-48 w-auto rounded"
							/>
						</div>
					)}

					{/* R2 upload progress */}
					{isR2 && isReplacing && uploadProgress > 0 && (
						<div className="space-y-1">
							<div className="h-2 w-full overflow-hidden rounded-full bg-grey-200">
								<div
									className="h-full rounded-full bg-primary transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
							<p className="text-grey-500 text-xs">{uploadProgress}% uploaded</p>
						</div>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isReplacing}
						className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 hover:bg-grey-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleReplace}
						disabled={isReplacing || !file}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50"
					>
						<RefreshCw className="h-4 w-4" />
						{isReplacing
							? "Replacing..."
							: `Replace ${isR2 ? "File" : "Image"}`}
					</button>
				</div>
			</div>
		</div>
	)
}
