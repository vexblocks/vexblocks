"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
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
import { MediaSelector } from "@/app/(dashboard)/media/_components/media-selector"
import { authAtom } from "@/lib/auth-atom"
import { sanitizeData } from "@/lib/sanitize-data"
import { triggerTypeGeneration } from "@/lib/use-type-generation"

type FieldType =
	| "shortText"
	| "longText"
	| "richText"
	| "media"
	| "file"
	| "url"
	| "youtubeUrl"
	| "boolean"
	| "number"
	| "date"
	| "select"
	| "group"
	| "repeater"

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

// Read-only view for a field (including nested fields)
function FieldViewItem({ field, depth = 0 }: { field: Field; depth?: number }) {
	const indentClass = depth > 0 ? "ml-4" : ""
	const borderColor = depth === 0 ? "border-grey-200" : "border-primary/20"
	const bgColor = depth === 0 ? "bg-white" : "bg-primary/5"

	return (
		<div className={indentClass}>
			<div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
				<div className="flex items-center gap-2">
					<h3 className="font-semibold text-primary">{field.label}</h3>
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
					<p className="mt-1 text-grey-500 text-sm">{field.helpText}</p>
				)}

				{/* Show nested fields for group/repeater type */}
				{(field.type === "group" || field.type === "repeater") &&
					field.fields &&
					field.fields.length > 0 && (
						<div className="mt-3 space-y-2 border-grey-200 border-t pt-3">
							<p className="font-medium text-grey-600 text-xs">
								{field.type === "repeater" ? "Item Fields:" : "Nested Fields:"}
							</p>
							{field.fields.map((nestedField) => (
								<FieldViewItem
									key={nestedField.id}
									field={nestedField}
									depth={depth + 1}
								/>
							))}
						</div>
					)}
			</div>
		</div>
	)
}

// FieldEditor for blocks with group support
function SimpleFieldEditor({
	field,
	index,
	depth = 0,
	onUpdate,
	onRemove,
	onMove,
	onAddNestedField,
	totalFields,
}: {
	field: Field
	index: number
	depth?: number
	onUpdate: (index: number, updates: Partial<Field>, depth: number) => void
	onRemove: (index: number, depth: number) => void
	onMove: (index: number, direction: "up" | "down", depth: number) => void
	onAddNestedField?: (parentIndex: number) => void
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
		// Combine both updates into a single call to avoid losing changes
		// when the closure captures stale state (especially for nested fields)
		const updates: Partial<Field> = { label: value }
		if (!hasEditedName && !field.isExisting) {
			updates.name = generateFieldName(value)
		}
		onUpdate(index, updates, depth)
	}

	const handleNameChange = (value: string) => {
		onUpdate(index, { name: value }, depth)
		setHasEditedName(true)
	}

	const borderColor = depth === 0 ? "border-grey-200" : "border-primary/30"
	const bgColor = depth === 0 ? "bg-white" : "bg-primary/5"

	return (
		<div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-medium text-grey-700 text-sm">
						Field #{index + 1}
						{depth > 0 && (
							<span className="ml-2 text-grey-400 text-xs">
								(Nested level {depth})
							</span>
						)}
					</span>
					{field.type === "group" && (
						<span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
							Group
						</span>
					)}
					{field.type === "repeater" && (
						<span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-700 text-xs">
							Repeater
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<div className="flex flex-col gap-1">
						<button
							type="button"
							onClick={() => onMove(index, "up", depth)}
							disabled={index === 0}
							className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
							title="Move up"
						>
							<ArrowUp className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => onMove(index, "down", depth)}
							disabled={index === totalFields - 1}
							className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
							title="Move down"
						>
							<ArrowDown className="h-4 w-4" />
						</button>
					</div>
					<button
						type="button"
						onClick={() => onRemove(index, depth)}
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
						onChange={(e) => {
							const newType = e.target.value as FieldType
							const updates: Partial<Field> = { type: newType }
							// Initialize nested fields array if type changes to group or repeater
							if (
								(newType === "group" || newType === "repeater") &&
								!field.fields
							) {
								updates.fields = []
							}
							// Reset nested fields if type changes from group/repeater
							if (
								(field.type === "group" || field.type === "repeater") &&
								newType !== "group" &&
								newType !== "repeater"
							) {
								updates.fields = undefined
							}
							onUpdate(index, updates, depth)
						}}
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
						<option value="file">File</option>
						<option value="select">Select</option>
						{depth < 2 && <option value="group">Group</option>}
						{depth < 2 && <option value="repeater">Repeater (Array)</option>}
					</select>
					{depth >= 2 && (
						<p className="mt-1 text-grey-400 text-xs">
							Group type not available at this nesting level
						</p>
					)}
				</div>
				<div className="flex items-end">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={field.required}
							onChange={(e) =>
								onUpdate(index, { required: e.target.checked }, depth)
							}
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
								onUpdate(
									index,
									{
										options: e.target.value.split(",").map((o) => o.trim()),
									},
									depth,
								)
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
						onChange={(e) =>
							onUpdate(index, { helpText: e.target.value }, depth)
						}
						placeholder="Hint for editors"
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					/>
				</div>
			</div>

			{/* Nested fields for group/repeater */}
			{(field.type === "group" || field.type === "repeater") && (
				<div className="mt-4 space-y-3">
					<div className="flex items-center justify-between border-grey-200 border-t pt-4">
						<h4 className="font-medium text-grey-700 text-sm">
							{field.type === "repeater" ? "Item Fields" : "Group Fields"}
						</h4>
						{onAddNestedField && (
							<button
								type="button"
								onClick={() => onAddNestedField(index)}
								className="flex items-center gap-1 rounded bg-primary/10 px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/20"
							>
								<Plus className="h-3 w-3" />
								Add Nested Field
							</button>
						)}
					</div>

					{field.fields && field.fields.length > 0 ? (
						<div className="ml-4 space-y-3">
							{field.fields.map((nestedField, nestedIndex) => (
								<SimpleFieldEditor
									key={nestedField.id}
									field={nestedField}
									index={nestedIndex}
									depth={depth + 1}
									onUpdate={(ni, updates) => {
										// Update nested field
										const newNestedFields = [...(field.fields || [])]
										newNestedFields[ni] = { ...newNestedFields[ni], ...updates }
										onUpdate(index, { fields: newNestedFields }, depth)
									}}
									onRemove={(ni) => {
										// Remove nested field
										const newNestedFields = (field.fields || []).filter(
											(_, i) => i !== ni,
										)
										onUpdate(index, { fields: newNestedFields }, depth)
									}}
									onMove={(ni, direction) => {
										// Move nested field
										const newIndex = direction === "up" ? ni - 1 : ni + 1
										if (newIndex < 0 || newIndex >= (field.fields?.length || 0))
											return
										const newNestedFields = [...(field.fields || [])]
										;[newNestedFields[ni], newNestedFields[newIndex]] = [
											newNestedFields[newIndex],
											newNestedFields[ni],
										]
										onUpdate(index, { fields: newNestedFields }, depth)
									}}
									onAddNestedField={
										depth + 1 < 2
											? (parentNestedIndex) => {
													// Add nested field to a level 1 field
													const newField: Field = {
														id: `field_${Date.now()}`,
														name: "",
														label: "",
														type: "shortText",
														required: false,
														isExisting: false,
													}
													const newNestedFields = [...(field.fields || [])]
													const targetField = newNestedFields[parentNestedIndex]
													newNestedFields[parentNestedIndex] = {
														...targetField,
														fields: [...(targetField.fields || []), newField],
													}
													onUpdate(index, { fields: newNestedFields }, depth)
												}
											: undefined
									}
									totalFields={field.fields?.length || 0}
								/>
							))}
						</div>
					) : (
						<div className="rounded border-2 border-grey-300 border-dashed p-4 text-center">
							<p className="text-grey-400 text-xs">
								No nested fields yet. Click "Add Nested Field" to add one.
							</p>
						</div>
					)}
				</div>
			)}
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

	// Check if the ID is a valid Convex ID (alphanumeric only)
	// Invalid IDs include DRP placeholders (%drp:, %kdrp:, etc.) and URL-encoded variants
	const isValidConvexId = /^[a-zA-Z0-9]+$/.test(id)

	const block = useQuery(
		api.cms.blocks.get,
		isReady && isValidConvexId ? { id: id as Id<"cmsBlocks"> } : "skip",
	)
	const updateBlock = useMutation(api.cms.blocks.update)
	const deleteBlock = useMutation(api.cms.blocks.remove)

	// Use URL param to determine edit mode
	const editing = searchParams.get("mode") === "edit"

	const setEditing = (value: boolean) => {
		if (value) {
			router.push(`/blocks/${id}?mode=edit`)
		} else {
			// Use full page navigation to avoid stale state issues with Convex queries
			window.location.href = `/blocks/${id}`
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

			// Helper to recursively map fields with IDs
			const mapFieldsWithIds = (fieldsArray: any[], prefix = ""): Field[] => {
				return fieldsArray.map((f: any, i: number) => {
					const fieldId = prefix ? `${prefix}_${i}` : `field_${i}`
					const mappedField: Field = {
						id: fieldId,
						name: f.name,
						label: f.label,
						type: f.type,
						required: f.required,
						helpText: f.helpText,
						options: f.options,
						isExisting: true,
					}

					// Recursively map nested fields for group and repeater types
					if ((f.type === "group" || f.type === "repeater") && f.fields) {
						mappedField.fields = mapFieldsWithIds(f.fields, fieldId)
					}

					return mappedField
				})
			}

			setFields(mapFieldsWithIds(block.fields))
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

	const handleAddNestedField = (parentIndex: number) => {
		const newField: Field = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: "shortText",
			required: false,
			isExisting: false,
		}

		setFields((prevFields) =>
			prevFields.map((f, i) => {
				if (i === parentIndex) {
					return {
						...f,
						fields: [...(f.fields || []), newField],
					}
				}
				return f
			}),
		)

		// Scroll to bottom smoothly after adding nested field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}

	const handleUpdateField = (
		index: number,
		updates: Partial<Field>,
		_depth = 0,
	) => {
		setFields((prev) =>
			prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
		)
	}

	const handleRemoveField = (index: number, _depth = 0) => {
		setFields((prev) => prev.filter((_, i) => i !== index))
	}

	const handleMoveField = (
		index: number,
		direction: "up" | "down",
		_depth = 0,
	) => {
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

	// Helper function to map fields recursively (including nested fields)
	const mapFieldsForSave = (fieldsArray: Field[]): any[] => {
		return fieldsArray.map((f) => {
			const mappedField: any = {
				name: f.name,
				label: f.label,
				type: f.type,
				required: f.required,
				helpText: f.helpText,
				options: f.options,
			}

			// Recursively include nested fields for group and repeater types
			if ((f.type === "group" || f.type === "repeater") && f.fields) {
				mappedField.fields = mapFieldsForSave(f.fields)
			}

			return mappedField
		})
	}

	const handleSave = async () => {
		setLoading(true)
		setError("")

		try {
			// Validate fields recursively
			const validateFields = (fieldsArray: Field[], level = 0): void => {
				const fieldNames = new Set<string>()
				for (const field of fieldsArray) {
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

					// Validate nested fields for group and repeater types
					if (
						(field.type === "group" || field.type === "repeater") &&
						field.fields
					) {
						if (field.fields.length === 0) {
							throw new Error(
								`${field.type === "repeater" ? "Repeater" : "Group"} "${field.label}" must have at least one nested field`,
							)
						}
						validateFields(field.fields, level + 1)
					}
				}
			}

			validateFields(fields)

			// Sanitize all data to remove unusual line terminators
			const sanitizedDisplayName = sanitizeData(displayName)
			const sanitizedDescription = sanitizeData(description)
			const sanitizedCategory = sanitizeData(category)
			const sanitizedFields = sanitizeData(mapFieldsForSave(fields))

			await updateBlock({
				id: id as Id<"cmsBlocks">,
				displayName: sanitizedDisplayName || undefined,
				description: sanitizedDescription || undefined,
				fields: sanitizedFields,
				category: sanitizedCategory || undefined,
				previewImage: previewImage || undefined,
			})

			// Trigger type generation in development
			triggerTypeGeneration()

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

			// Trigger type generation in development
			triggerTypeGeneration()

			router.push("/blocks")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete block")
			setLoading(false)
		}
	}

	if (!block) {
		return (
			<div className="flex min-h-100 items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">
						{!isValidConvexId ? "Creating block..." : "Loading block..."}
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl pb-24">
			<div className="mb-6">
				<Link
					href="/blocks"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Blocks
				</Link>
			</div>

			<div className="mb-6">
				<h1 className="font-bold text-3xl text-primary">{block.displayName}</h1>
				{block.category && (
					<p className="mt-2 text-grey-500">{block.category}</p>
				)}
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

			<div className="rounded-sm border border-grey-200 bg-white p-6 shadow-md">
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
								<span className="mb-1 block text-grey-700 text-sm">
									Preview Image (optional)
								</span>
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
											className="absolute -top-2 -right-2 rounded-full bg-error p-1 text-white shadow-md transition-colors hover:bg-error/80"
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
					<div className="mb-4">
						<h2 className="font-semibold text-xl">Fields</h2>
					</div>
					<div className="space-y-3">
						{editing
							? fields.map((field, index) => (
									<SimpleFieldEditor
										key={field.id}
										field={field}
										index={index}
										depth={0}
										onUpdate={handleUpdateField}
										onRemove={handleRemoveField}
										onMove={handleMoveField}
										onAddNestedField={handleAddNestedField}
										totalFields={fields.length}
									/>
								))
							: fields.map((field) => (
									<FieldViewItem key={field.id} field={field} />
								))}
					</div>
				</div>
			</div>

			{/* Fixed bottom action bar */}
			<div className="fixed inset-x-0 bottom-0 z-10 border-grey-200 border-t bg-white p-4 shadow-lg">
				<div className="mx-auto flex max-w-4xl items-center justify-between">
					{editing ? (
						<>
							<button
								type="button"
								onClick={handleAddField}
								className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-white transition-colors hover:bg-secondary-dark"
							>
								<Plus className="h-4 w-4" />
								Add Field
							</button>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => {
										setEditing(false)
										setError("")
										if (block) {
											setDisplayName(block.displayName)
											setDescription(block.description || "")
											setCategory(block.category || "")
											setPreviewImage(block.previewImage || "")

											const mapFieldsWithIds = (
												fieldsArray: any[],
												prefix = "",
											): Field[] => {
												return fieldsArray.map((f: any, i: number) => {
													const fieldId = prefix
														? `${prefix}_${i}`
														: `field_${i}`
													const mappedField: Field = {
														id: fieldId,
														name: f.name,
														label: f.label,
														type: f.type,
														required: f.required,
														helpText: f.helpText,
														options: f.options,
														isExisting: true,
													}

													if (
														(f.type === "group" || f.type === "repeater") &&
														f.fields
													) {
														mappedField.fields = mapFieldsWithIds(
															f.fields,
															fieldId,
														)
													}

													return mappedField
												})
											}

											setFields(mapFieldsWithIds(block.fields))
										}
									}}
									className="rounded-lg border border-grey-300 px-6 py-2 text-grey-500 transition-colors hover:bg-grey-100"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={loading}
									className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
								>
									<Save className="h-4 w-4" />
									{loading ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</>
					) : (
						<>
							<div />
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(true)}
									className="rounded-lg border border-error px-4 py-2 text-error transition-colors hover:bg-error/5"
								>
									Delete
								</button>
								<button
									type="button"
									onClick={() => setEditing(true)}
									className="rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-800"
								>
									Edit Block
								</button>
							</div>
						</>
					)}
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
