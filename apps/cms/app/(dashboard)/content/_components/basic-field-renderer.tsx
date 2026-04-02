"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage, getStringValue } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { FileUp, Image as ImageIcon, RefreshCw, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import type { Field } from "./types"

const MapFieldEditor = dynamic(
	() => import("./map-field").then((mod) => mod.MapFieldEditor),
	{ ssr: false },
)

// Sanitize content to remove unusual line terminators
function _sanitizeRichText(content: string): string {
	if (!content || typeof content !== "string") return content
	return content.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")
}

// Dynamic import for Lexical to avoid SSR issues
const LexicalEditor = dynamic(
	() => import("@/components/editor/lexical-editor"),
	{ ssr: false },
)

// Sub-component to display file info (needs useQuery hook)
function FilePreview({
	mediaId,
	onRemove,
	onChangeFile,
}: {
	mediaId: string
	onRemove: () => void
	onChangeFile: () => void
}) {
	const media = useQuery(api.cms.media.get, {
		id: mediaId as Id<"cmsMedia">,
	})

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const ext = media?.filename?.split(".").pop()?.toUpperCase()

	return (
		<div className="inline-flex w-full flex-col items-center">
			<div className="group relative max-w-md overflow-hidden rounded-lg border border-grey-300 bg-grey-50 transition-all hover:border-primary hover:shadow-md">
				<div className="flex items-center gap-3 p-4">
					<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<FileUp className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-grey-700 text-sm">
							{media?.caption || "Loading..."}
						</p>
						{media && (
							<p className="text-grey-400 text-xs">
								{ext && (
									<span className="mr-1 font-medium uppercase">{ext}</span>
								)}
								{formatFileSize(media.size)}
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-error text-white shadow-lg transition-all hover:scale-110 hover:bg-error/90"
						title="Remove file"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="border-grey-200 border-t bg-white p-3">
					<button
						type="button"
						onClick={onChangeFile}
						className="w-full rounded-lg bg-grey-100 px-4 py-2 font-medium text-grey-700 text-sm transition-colors hover:bg-grey-200"
					>
						Change File
					</button>
				</div>
			</div>
		</div>
	)
}

// Dynamic import for MediaSelector to avoid SSR issues
const MediaSelector = dynamic(
	() =>
		import("../../media/_components/media-selector").then(
			(mod) => mod.MediaSelector,
		),
	{ ssr: false },
)

type BasicFieldRendererProps = {
	field: Field
	value: any
	onChange: (value: any) => void
	fieldId: string
	allSchemas?: any[]
	allContent?: Record<string, any[]>
	onRegenerateSlug?: () => void
	isAutoSlugActive?: boolean
}

export function BasicFieldRenderer({
	field,
	value,
	onChange,
	fieldId,
	allSchemas,
	allContent,
	onRegenerateSlug,
	isAutoSlugActive,
}: BasicFieldRendererProps) {
	const [showMediaSelector, setShowMediaSelector] = useState(false)
	const hasSetDefault = useRef(false)

	// Pre-fill with schema defaultValue when the field has no value yet
	useEffect(() => {
		if (
			!hasSetDefault.current &&
			(value === undefined || value === null || value === "") &&
			field.defaultValue
		) {
			onChange(field.defaultValue)
			hasSetDefault.current = true
		}
	}, [value, field.defaultValue, onChange])

	// Reset flag when field changes
	useEffect(() => {
		hasSetDefault.current = false
	}, [])

	// Provide consistent default based on type to prevent uncontrolled component warnings
	const defaultValue =
		value ??
		field.defaultValue ??
		(field.type === "number" ? 0 : field.type === "boolean" ? false : "")

	switch (field.type) {
		case "shortText":
			return (
				<div>
					<input
						type="text"
						id={fieldId}
						value={defaultValue}
						onChange={(e) => onChange(e.target.value)}
						placeholder={field.defaultValue ?? field.helpText}
						required={field.required}
						className={`w-full rounded-lg border px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
							field.isSlug
								? "border-blue-300 bg-blue-50 text-blue-900"
								: "border-grey-300 text-grey-500"
						}`}
					/>
					{field.isSlug && field.slugSource && (
						<div className="mt-1 flex items-center gap-2">
							<p className="text-blue-600 text-xs">
								{isAutoSlugActive ? (
									<>✨ Auto-generating from "{field.slugSource}"</>
								) : (
									<>✏️ Manual mode (editable)</>
								)}
							</p>
							{onRegenerateSlug && !isAutoSlugActive && (
								<button
									type="button"
									onClick={onRegenerateSlug}
									className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-blue-700 text-xs transition-colors marker:text-xs hover:bg-blue-200"
									title="Regenerate slug from source field"
								>
									<RefreshCw className="h-3 w-3" />
									Regenerate
								</button>
							)}
						</div>
					)}
				</div>
			)

		case "longText":
			return (
				<div>
					<TextareaAutosize
						id={fieldId}
						value={defaultValue}
						onChange={(e) => onChange(e.target.value)}
						placeholder={field.defaultValue ?? field.helpText}
						required={field.required}
						minRows={1}
						maxRows={10}
						className="w-full resize-none rounded-lg border border-grey-300 px-3 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			)

		case "richText":
			return (
				<LexicalEditor
					key={fieldId}
					value={_sanitizeRichText(defaultValue)}
					onChange={onChange}
					placeholder={field.helpText || "Enter rich text content..."}
				/>
			)

		case "number":
			return (
				<input
					type="number"
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(Number.parseFloat(e.target.value))}
					placeholder={field.helpText}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "boolean":
			return (
				<label htmlFor={fieldId} className="flex items-center gap-3">
					<input
						type="checkbox"
						id={fieldId}
						checked={defaultValue || false}
						onChange={(e) => onChange(e.target.checked)}
						className="h-5 w-5 rounded border-grey-300"
					/>
					<span className="text-grey-500">{field.helpText || "Enable"}</span>
				</label>
			)

		case "date":
			return (
				<input
					type="date"
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "datetime":
			return (
				<input
					type="datetime-local"
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "time":
			return (
				<input
					type="time"
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "url": {
			const urlValue =
				typeof value === "object" && value !== null
					? {
							url: typeof value.url === "string" ? value.url : "",
							newWindow: value.newWindow ?? false,
						}
					: {
							url: typeof value === "string" ? value : "",
							newWindow: false,
						}
			const urlPattern = "^(https?://.+|/.*|#.*|mailto:.+|tel:.+)$"
			const isInvalid =
				urlValue.url.length > 0 && !new RegExp(urlPattern).test(urlValue.url)
			return (
				<div className="space-y-2">
					<input
						type="text"
						id={fieldId}
						value={urlValue.url}
						onChange={(e) => onChange({ ...urlValue, url: e.target.value })}
						placeholder={field.helpText || "https://example.com"}
						required={field.required}
						pattern={urlPattern}
						className={`w-full rounded-lg border px-4 py-2 text-grey-500 transition-colors focus:outline-none focus:ring-2 ${
							isInvalid
								? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
								: "border-grey-300 focus:border-primary focus:ring-primary/20"
						}`}
					/>
					<p className="text-grey-400 text-xs leading-relaxed">
						Accepted formats:{" "}
						<span className="font-mono">https://example.com</span> ·{" "}
						<span className="font-mono">/about</span> ·{" "}
						<span className="font-mono">#section</span> ·{" "}
						<span className="font-mono">mailto:hello@example.com</span> ·{" "}
						<span className="font-mono">tel:+1234567890</span>
					</p>
					{isInvalid && (
						<p className="text-red-500 text-xs">
							Invalid URL format. Please use one of the accepted formats above.
						</p>
					)}
					<label className="flex cursor-pointer items-center gap-2 text-grey-500 text-sm">
						<input
							type="checkbox"
							checked={urlValue.newWindow ?? false}
							onChange={(e) =>
								onChange({ ...urlValue, newWindow: e.target.checked })
							}
							className="h-4 w-4 cursor-pointer rounded border-grey-300 text-primary focus:ring-primary/20"
						/>
						Open in new window
					</label>
				</div>
			)
		}

		case "youtubeUrl":
			return (
				<div className="space-y-2">
					<input
						type="text"
						id={fieldId}
						value={defaultValue}
						onChange={(e) => onChange(e.target.value)}
						placeholder={
							field.helpText ||
							"https://www.youtube.com/watch?v=... or https://youtu.be/..."
						}
						required={field.required}
						pattern="^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+$"
						title="Enter a YouTube video URL"
						className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
					{defaultValue && (
						<div className="rounded-lg border border-grey-200 bg-grey-50 p-2">
							<p className="text-grey-600 text-xs">Preview:</p>
							<div className="mt-2 aspect-video w-full overflow-hidden rounded">
								<iframe
									src={defaultValue
										.replace("watch?v=", "embed/")
										.replace("youtu.be/", "youtube.com/embed/")}
									title="YouTube video preview"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
									className="h-full w-full"
								/>
							</div>
						</div>
					)}
				</div>
			)

		case "select":
			return (
				<select
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Select an option...</option>
					{field.options?.map((option: string) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			)

		case "media":
			return (
				<>
					<div className="space-y-4">
						{value ? (
							<div className="inline-flex w-full flex-col items-center">
								<div className="group relative max-w-40 overflow-hidden rounded-lg border border-grey-300 bg-grey-50 transition-all hover:border-primary hover:shadow-md">
									<div className="relative overflow-hidden bg-grey-100">
										<CFImage
											assetId={value}
											alt={field.label}
											width={160}
											height={160}
											variant="public"
											className="h-auto max-h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
										<button
											type="button"
											onClick={() => onChange("")}
											className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-error text-white shadow-lg transition-all hover:scale-110 hover:bg-error/90"
											title="Remove image"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
									<div className="border-grey-200 border-t bg-white p-3">
										<button
											type="button"
											onClick={() => setShowMediaSelector(true)}
											className="w-full rounded-lg bg-grey-100 px-4 py-2 font-medium text-grey-700 text-sm transition-colors hover:bg-grey-200"
										>
											Change Image
										</button>
									</div>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setShowMediaSelector(true)}
								className="group flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 p-4 transition-all hover:border-primary hover:bg-primary/5"
							>
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-100 transition-colors group-hover:bg-primary/10">
									<ImageIcon className="h-8 w-8 text-grey-400 transition-colors group-hover:text-primary" />
								</div>
								<div className="text-center">
									<p className="font-medium text-grey-700 text-sm transition-colors group-hover:text-primary">
										Select from Media Library
									</p>
									<p className="mt-1 text-grey-500 text-xs">
										Click to browse and choose an image
									</p>
								</div>
							</button>
						)}
					</div>

					{showMediaSelector && (
						<MediaSelector
							selectedCloudflareId={value}
							filterType="images"
							onSelect={(media: {
								id: Id<"cmsMedia">
								cloudflareId: string
							}) => {
								onChange(media.cloudflareId)
								setShowMediaSelector(false)
							}}
							onClose={() => setShowMediaSelector(false)}
						/>
					)}
				</>
			)

		case "file":
			return (
				<>
					<div className="space-y-4">
						{value ? (
							<FilePreview
								mediaId={value}
								onRemove={() => onChange("")}
								onChangeFile={() => setShowMediaSelector(true)}
							/>
						) : (
							<button
								type="button"
								onClick={() => setShowMediaSelector(true)}
								className="group flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 p-4 transition-all hover:border-primary hover:bg-primary/5"
							>
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-100 transition-colors group-hover:bg-primary/10">
									<FileUp className="h-8 w-8 text-grey-400 transition-colors group-hover:text-primary" />
								</div>
								<div className="text-center">
									<p className="font-medium text-grey-700 text-sm transition-colors group-hover:text-primary">
										Select from File Library
									</p>
									<p className="mt-1 text-grey-500 text-xs">
										Click to browse and choose a file
									</p>
								</div>
							</button>
						)}
					</div>

					{showMediaSelector && (
						<MediaSelector
							filterType="files"
							onSelect={(media: {
								id: Id<"cmsMedia">
								cloudflareId: string
							}) => {
								onChange(String(media.id))
								setShowMediaSelector(false)
							}}
							onClose={() => setShowMediaSelector(false)}
						/>
					)}
				</>
			)

		case "reference": {
			const referencedSchema = allSchemas?.find(
				(s) => s.name === field.referenceSchema,
			)
			const referencedContent = allContent?.[field.referenceSchema || ""] || []

			if (!referencedSchema) {
				return (
					<div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-700">
							Referenced schema "{field.referenceSchema}" not found. Please
							create it first.
						</p>
					</div>
				)
			}

			return (
				<select
					id={fieldId}
					value={value || ""}
					onChange={(e) => onChange(e.target.value || null)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Select {referencedSchema.displayName}...</option>
					{referencedContent.map((item: any) => {
						const displayValue =
							getStringValue(item.data?.title) ||
							getStringValue(item.data?.name) ||
							getStringValue(item.data?.displayName) ||
							item.slug ||
							item._id
						return (
							<option key={item._id} value={item._id}>
								{displayValue}
							</option>
						)
					})}
				</select>
			)
		}

		case "map":
			return <MapFieldEditor value={value ?? null} onChange={onChange} />

		case "multiReference": {
			const referencedSchema = allSchemas?.find(
				(s) => s.name === field.referenceSchema,
			)
			const referencedContent = allContent?.[field.referenceSchema || ""] || []

			if (!referencedSchema) {
				return (
					<div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-700">
							Referenced schema "{field.referenceSchema}" not found. Please
							create it first.
						</p>
					</div>
				)
			}

			const selectedIds = (value || []) as string[]

			return (
				<div className="space-y-2">
					<div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-grey-300 p-3">
						{referencedContent.length === 0 ? (
							<p className="text-grey-400 text-sm">
								No {referencedSchema.displayName} available. Create some first.
							</p>
						) : (
							referencedContent.map((item: any) => {
								const displayValue =
									getStringValue(item.data?.title) ||
									getStringValue(item.data?.name) ||
									getStringValue(item.data?.displayName) ||
									item.slug ||
									item._id
								const isSelected = selectedIds.includes(item._id)

								return (
									<label
										key={item._id}
										className="flex cursor-pointer items-center gap-3 rounded border border-grey-200 p-2 transition-colors hover:bg-grey-50"
									>
										<input
											type="checkbox"
											checked={isSelected}
											onChange={(e) => {
												if (e.target.checked) {
													onChange([...selectedIds, item._id])
												} else {
													onChange(selectedIds.filter((id) => id !== item._id))
												}
											}}
											className="h-4 w-4 rounded"
										/>
										<span className="text-grey-700 text-sm">
											{displayValue}
										</span>
									</label>
								)
							})
						)}
					</div>
					{selectedIds.length > 0 && (
						<p className="text-grey-400 text-xs">
							{selectedIds.length} {referencedSchema.displayName} selected
						</p>
					)}
				</div>
			)
		}

		default:
			return (
				<input
					type="text"
					id={fieldId}
					value={defaultValue}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.helpText}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)
	}
}
