"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { useAtom } from "@lfades/atom"
import { useMutation, useQuery } from "convex/react"
import {
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ImageIcon,
	Plus,
	Save,
	Trash2,
	X,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useEffect, useState } from "react"
import { authAtom } from "@/lib/auth-atom"
import { MediaSelector } from "@/app/(dashboard)/media/_components/media-selector"

type FieldType =
	| "shortText"
	| "longText"
	| "richText"
	| "media"
	| "url"
	| "youtubeUrl"
	| "boolean"
	| "number"
	| "date"
	| "select"
	| "group"

type Field = {
	id: string
	name: string
	label: string
	type: FieldType
	required: boolean
	helpText?: string
	options?: string[]
	fields?: Field[]
	isExisting?: boolean
}

// Simple FieldEditor for blocks (no deep nesting needed)
function SimpleFieldEditor({
	field,
	index,
	onUpdate,
	onRemove,
	onMove,
	totalFields,
}: {
	field: Field
	index: number
	onUpdate: (index: number, updates: Partial<Field>) => void
	onRemove: (index: number) => void
	onMove: (index: number, direction: "up" | "down") => void
	totalFields: number
}) {
	// Track if field name has been manually edited
	const [hasEditedName, setHasEditedName] = useState(false)

	const generateFieldName = (label: string) => {
		return label
			.toLowerCase()
			.replace(/[áàäâã]/g, "a")
			.replace(/[éèëê]/g, "e")
			.replace(/[íìïî]/g, "i")
			.replace(/[óòöôõ]/g, "o")
			.replace(/[úùüû]/g, "u")
			.replace(/[ñ]/g, "n")
			.replace(/[^a-z0-9\s]/g, "")
			.replace(/\s+/g, "_")
			.trim()
	}

	const handleLabelChange = (value: string) => {
		onUpdate(index, { label: value })
		if (!hasEditedName && !field.isExisting) {
			onUpdate(index, { name: generateFieldName(value) })
		}
	}

	const handleNameChange = (value: string) => {
		onUpdate(index, { name: value })
		setHasEditedName(true)
	}

	return (
		<div className="rounded-lg border border-grey-200 bg-white p-4">
			<div className="mb-3 flex items-center justify-between">
				<span className="font-medium text-grey-700 text-sm">
					Field #{index + 1}
				</span>
				<div className="flex items-center gap-2">
					<div className="flex flex-col gap-1">
						<button
							type="button"
							onClick={() => onMove(index, "up")}
							disabled={index === 0}
							className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
							title="Move up"
						>
							<ArrowUp className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => onMove(index, "down")}
							disabled={index === totalFields - 1}
							className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
							title="Move down"
						>
							<ArrowDown className="h-4 w-4" />
						</button>
					</div>
					<button
						type="button"
						onClick={() => onRemove(index)}
						className="text-error hover:text-error/80"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<div>
					<label
						htmlFor={`field-label-${field.id}`}
						className="mb-1 block text-grey-600 text-xs"
					>
						Label
					</label>
					<input
						id={`field-label-${field.id}`}
						type="text"
						value={field.label}
						onChange={(e) => handleLabelChange(e.target.value)}
						placeholder="Post Title"
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					/>
				</div>
				<div className="relative pb-6">
					<label
						htmlFor={`field-name-${field.id}`}
						className="mb-1 block text-grey-600 text-xs"
					>
						Field Name
					</label>
					<input
						id={`field-name-${field.id}`}
						type="text"
						value={field.name}
						onChange={(e) => handleNameChange(e.target.value)}
						placeholder="post_title"
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					/>
					<div className="absolute top-full left-0 mt-1">
						{!hasEditedName && field.label && (
							<p className="text-blue-600 text-xs">
								✨ Auto-generated from "Label"
							</p>
						)}
					</div>
				</div>
				<div>
					<label
						htmlFor={`field-type-${field.id}`}
						className="mb-1 block text-grey-600 text-xs"
					>
						Type
					</label>
					<select
						id={`field-type-${field.id}`}
						value={field.type}
						onChange={(e) =>
							onUpdate(index, { type: e.target.value as FieldType })
						}
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					>
						<option value="shortText">Short Text</option>
						<option value="longText">Long Text</option>
						<option value="richText">Rich Text</option>
						<option value="number">Number</option>
						<option value="boolean">Boolean</option>
						<option value="date">Date</option>
						<option value="url">URL</option>
						<option value="youtubeUrl">YouTube URL</option>
						<option value="media">Media</option>
						<option value="select">Select</option>
					</select>
				</div>
				<div className="flex items-end">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={field.required}
							onChange={(e) => onUpdate(index, { required: e.target.checked })}
							className="h-4 w-4"
						/>
						<span className="text-sm">Required</span>
					</label>
				</div>
				{field.type === "select" && (
					<div className="md:col-span-2">
						<label
							htmlFor={`field-options-${field.id}`}
							className="mb-1 block text-grey-600 text-xs"
						>
							Options (comma-separated)
						</label>
						<input
							id={`field-options-${field.id}`}
							type="text"
							value={field.options?.join(", ") || ""}
							onChange={(e) =>
								onUpdate(index, {
									options: e.target.value.split(",").map((o) => o.trim()),
								})
							}
							placeholder="Option 1, Option 2"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>
				)}
				<div className="md:col-span-2">
					<label
						htmlFor={`field-help-${field.id}`}
						className="mb-1 block text-grey-600 text-xs"
					>
						Help Text (optional)
					</label>
					<input
						id={`field-help-${field.id}`}
						type="text"
						value={field.helpText || ""}
						onChange={(e) => onUpdate(index, { helpText: e.target.value })}
						placeholder="Hint for editors"
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					/>
				</div>
			</div>
		</div>
	)
}

export default function BlockDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const router = useRouter()
	const searchParams = useSearchParams()

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const block = useQuery(
		api.cms.blocks.get,
		isReady ? { id: id as Id<"cmsBlocks"> } : "skip",
	)
	const updateBlock = useMutation(api.cms.blocks.update)
	const deleteBlock = useMutation(api.cms.blocks.remove)

	// Use URL param to determine edit mode
	const editing = searchParams.get("mode") === "edit"

	const setEditing = (value: boolean) => {
		if (value) {
			router.push(`/blocks/${id}?mode=edit`)
		} else {
			router.push(`/blocks/${id}`)
		}
	}

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showMediaSelector, setShowMediaSelector] = useState(false)

	const [displayName, setDisplayName] = useState("")
	const [description, setDescription] = useState("")
	const [category, setCategory] = useState("")
	const [previewImage, setPreviewImage] = useState("")
	const [fields, setFields] = useState<Field[]>([])

	useEffect(() => {
		if (block) {
			setDisplayName(block.displayName)
			setDescription(block.description || "")
			setCategory(block.category || "")
			setPreviewImage(block.previewImage || "")
			setFields(
				block.fields.map((f: any, i: number) => ({
					id: `field_${i}`,
					...f,
					isExisting: true,
				})),
			)
		}
	}, [block])

	const handleAddField = () => {
		setFields([
			...fields,
			{
				id: `field_${Date.now()}`,
				name: "",
				label: "",
				type: "shortText",
				required: false,
				isExisting: false,
			},
		])

		// Scroll to bottom smoothly after adding field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}

	const handleUpdateField = (index: number, updates: Partial<Field>) => {
		setFields((prev) =>
			prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
		)
	}

	const handleRemoveField = (index: number) => {
		setFields((prev) => prev.filter((_, i) => i !== index))
	}

	const handleMoveField = (index: number, direction: "up" | "down") => {
		setFields((prevFields) => {
			const newIndex = direction === "up" ? index - 1 : index + 1
			if (newIndex < 0 || newIndex >= prevFields.length) return prevFields

			const newFields = [...prevFields]
			;[newFields[index], newFields[newIndex]] = [
				newFields[newIndex],
				newFields[index],
			]
			return newFields
		})
	}

	const mapFieldsForSave = (fieldsArray: Field[]): any[] => {
		return fieldsArray.map((f) => ({
			name: f.name,
			label: f.label,
			type: f.type,
			required: f.required,
			helpText: f.helpText,
			options: f.options,
		}))
	}

	const handleSave = async () => {
		setLoading(true)
		setError("")

		try {
			// Check for duplicate field names
			const fieldNames = new Set<string>()
			for (const field of fields) {
				if (!field.name.trim() || !field.label.trim()) {
					throw new Error("All fields must have a name and label")
				}

				// Check for duplicate field name
				if (fieldNames.has(field.name)) {
					throw new Error(
						`Duplicate field name "${field.name}" found. Each field must have a unique name.`,
					)
				}
				fieldNames.add(field.name)

				if (
					field.type === "select" &&
					(!field.options || field.options.length === 0)
				) {
					throw new Error(`Field "${field.label}" requires options`)
				}
			}

			await updateBlock({
				id: id as Id<"cmsBlocks">,
				displayName: displayName || undefined,
				description: description || undefined,
				fields: mapFieldsForSave(fields),
				category: category || undefined,
				previewImage: previewImage || undefined,
			})

			setEditing(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update block")
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		setLoading(true)
		try {
			await deleteBlock({ id: id as Id<"cmsBlocks"> })
			router.push("/blocks")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete block")
			setLoading(false)
		}
	}

	if (!block) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading block...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<Link
					href="/blocks"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Blocks
				</Link>
			</div>

			<div className="mb-6 flex items-start justify-between">
				<div>
					<h1 className="font-bold text-3xl text-primary">
						{block.displayName}
					</h1>
					{block.category && (
						<p className="mt-2 text-grey-500">{block.category}</p>
					)}
				</div>
				<div className="flex gap-2">
					{!editing ? (
						<>
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
							>
								Edit Block
							</button>
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="rounded bg-error px-4 py-2 text-white hover:bg-error/90"
							>
								Delete
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									setEditing(false)
									setError("")
									if (block) {
										setDisplayName(block.displayName)
										setDescription(block.description || "")
										setCategory(block.category || "")
										setFields(
											block.fields.map((f: any, i: number) => ({
												id: `field_${i}`,
												...f,
												isExisting: true,
											})),
										)
									}
								}}
								className="rounded border border-grey-300 px-4 py-2 text-grey-700 hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={loading}
								className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
							>
								<Save className="h-4 w-4" />
								{loading ? "Saving..." : "Save Changes"}
							</button>
						</>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-red-50 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-white p-6">
						<div className="mb-4 flex items-center gap-3">
							<AlertTriangle className="h-6 w-6 text-error" />
							<h2 className="font-bold text-xl">Delete Block?</h2>
						</div>
						<p className="mb-6 text-grey-600">
							Are you sure? Content using this block will retain the data but
							won't be editable.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="rounded border border-grey-300 px-4 py-2"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={loading}
								className="rounded bg-error px-4 py-2 text-white disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="rounded-lg bg-white p-6 shadow-md">
				<div className="mb-6">
					<h2 className="mb-4 font-semibold text-xl">Basic Information</h2>
					{editing ? (
						<div className="space-y-4">
							<div>
								<label
									htmlFor="edit-display-name"
									className="mb-1 block text-grey-700 text-sm"
								>
									Display Name
								</label>
								<input
									id="edit-display-name"
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="w-full rounded border border-grey-300 px-3 py-2"
								/>
							</div>
							<div>
								<label
									htmlFor="edit-description"
									className="mb-1 block text-grey-700 text-sm"
								>
									Description
								</label>
								<textarea
									id="edit-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
									className="w-full rounded border border-grey-300 px-3 py-2"
								/>
							</div>
							<div>
								<label
									htmlFor="edit-category"
									className="mb-1 block text-grey-700 text-sm"
								>
									Category
								</label>
								<input
									id="edit-category"
									type="text"
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									className="w-full rounded border border-grey-300 px-3 py-2"
								/>
							</div>
							<div>
								<label className="mb-1 block text-grey-700 text-sm">
									Preview Image (optional)
								</label>
								<p className="mb-2 text-grey-500 text-xs">
									Add an image to help users visually identify this block when
									selecting it
								</p>
								{previewImage ? (
									<div className="relative inline-block">
										<CFImage
											assetId={previewImage}
											alt="Preview"
											width={192}
											height={128}
											variant="public"
											className="h-32 w-48 rounded-lg border border-grey-200 object-cover"
										/>
										<button
											type="button"
											onClick={() => setPreviewImage("")}
											className="-top-2 -right-2 absolute rounded-full bg-error p-1 text-white shadow-md transition-colors hover:bg-error/80"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => setShowMediaSelector(true)}
										className="flex items-center gap-2 rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 px-4 py-3 text-grey-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
									>
										<ImageIcon className="h-5 w-5" />
										Select Preview Image
									</button>
								)}
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<p className="text-grey-600">
								<span className="font-medium">Name:</span> {block.name}
							</p>
							{block.description && (
								<p className="text-grey-600">
									<span className="font-medium">Description:</span>{" "}
									{block.description}
								</p>
							)}
							{block.previewImage && (
								<div className="mt-3">
									<span className="font-medium text-grey-600">Preview:</span>
									<div className="mt-2">
										<CFImage
											assetId={block.previewImage}
											alt="Block preview"
											width={144}
											height={96}
											variant="public"
											className="h-24 w-36 rounded-lg border border-grey-200 object-cover"
										/>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-xl">Fields</h2>
						{editing && (
							<button
								type="button"
								onClick={handleAddField}
								className="flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm text-white"
							>
								<Plus className="h-4 w-4" />
								Add Field
							</button>
						)}
					</div>
					<div className="space-y-3">
						{editing
							? fields.map((field, index) => (
									<SimpleFieldEditor
										key={field.id}
										field={field}
										index={index}
										onUpdate={handleUpdateField}
										onRemove={handleRemoveField}
										onMove={handleMoveField}
										totalFields={fields.length}
									/>
								))
							: fields.map((field) => (
									<div
										key={field.id}
										className="rounded-lg border border-grey-200 p-4"
									>
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-primary">
												{field.label}
											</h3>
											<code className="rounded bg-grey-100 px-2 py-0.5 text-xs">
												{field.name}
											</code>
											<span className="rounded bg-grey-200 px-2 py-0.5 text-xs">
												{field.type}
											</span>
											{field.required && (
												<span className="text-error text-xs">Required</span>
											)}
										</div>
										{field.helpText && (
											<p className="mt-1 text-grey-500 text-sm">
												{field.helpText}
											</p>
										)}
									</div>
								))}
					</div>
				</div>
			</div>

			{/* Media Selector Dialog */}
			{showMediaSelector && (
				<MediaSelector
					selectedCloudflareId={previewImage}
					onSelect={(media) => {
						setPreviewImage(media.cloudflareId)
						setShowMediaSelector(false)
					}}
					onClose={() => setShowMediaSelector(false)}
				/>
			)}
		</div>
	)
}
