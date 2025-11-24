"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useMutation } from "convex/react"
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

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
	fields?: Field[] // Nested fields for group type
}

const FieldEditor = ({
	field,
	index,
	depth = 0,
	parentPath = [],
	onUpdateField,
	onRemoveField,
	onAddNestedField,
	onMoveField,
	totalFields,
}: {
	field: Field
	index: number
	depth?: number
	parentPath?: string[]
	onUpdateField: (
		id: string,
		updates: Partial<Field>,
		parentPath: string[],
	) => void
	onRemoveField: (id: string, parentPath: string[]) => void
	onAddNestedField: (parentId: string, parentPath: string[]) => void
	onMoveField: (
		id: string,
		direction: "up" | "down",
		parentPath: string[],
	) => void
	totalFields: number
}) => {
	const currentPath = [...parentPath, field.id]
	const indentClass = depth > 0 ? `ml-${depth * 4}` : ""
	const borderColor = depth === 0 ? "border-grey-200" : "border-primary/30"
	const bgColor = depth === 0 ? "bg-white" : "bg-primary/5"

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
		onUpdateField(field.id, { label: value }, parentPath)
		if (!hasEditedName) {
			onUpdateField(field.id, { name: generateFieldName(value) }, parentPath)
		}
	}

	const handleNameChange = (value: string) => {
		onUpdateField(field.id, { name: value }, parentPath)
		setHasEditedName(true)
	}

	return (
		<div className={indentClass}>
			<div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-medium text-grey-500 text-sm">
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
					</div>
					<div className="flex items-center gap-2">
						<div className="flex flex-col gap-1">
							<button
								type="button"
								onClick={() => onMoveField(field.id, "up", parentPath)}
								disabled={index === 0}
								className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
								title="Move up"
							>
								<ArrowUp className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => onMoveField(field.id, "down", parentPath)}
								disabled={index === totalFields - 1}
								className="text-grey-500 transition-colors hover:text-primary disabled:opacity-30"
								title="Move down"
							>
								<ArrowDown className="h-4 w-4" />
							</button>
						</div>
						<button
							type="button"
							onClick={() => onRemoveField(field.id, parentPath)}
							className="text-error transition-colors hover:text-error-light"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label
							htmlFor={`field-label-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
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
							className="mb-1 block font-medium text-grey-500 text-xs"
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
						<div className="-mt-3 absolute top-full left-0">
							{!hasEditedName && field.label && (
								<p className="text-red-600 text-xs">
									✨ Auto-generated from "Label"
								</p>
							)}
						</div>
					</div>

					<div>
						<label
							htmlFor={`field-type-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Type
						</label>
						<select
							id={`field-type-${field.id}`}
							value={field.type}
							onChange={(e) =>
								onUpdateField(
									field.id,
									{
										type: e.target.value as FieldType,
									},
									parentPath,
								)
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
							{depth < 1 && <option value="group">Group</option>}
						</select>
						{depth >= 1 && (
							<p className="mt-1 text-grey-400 text-xs">
								Group type not available at this nesting level
							</p>
						)}
					</div>

					<div className="flex items-end">
						<label
							htmlFor={`field-required-${field.id}`}
							className="flex items-center gap-2"
						>
							<input
								id={`field-required-${field.id}`}
								type="checkbox"
								checked={field.required}
								onChange={(e) =>
									onUpdateField(
										field.id,
										{
											required: e.target.checked,
										},
										parentPath,
									)
								}
								className="h-4 w-4 rounded border-grey-300"
							/>
							<span className="text-grey-500 text-sm">Required</span>
						</label>
					</div>

					{field.type === "select" && (
						<div className="md:col-span-2">
							<label
								htmlFor={`field-options-${field.id}`}
								className="mb-1 block font-medium text-grey-500 text-xs"
							>
								Options (comma separated)
							</label>
							<input
								id={`field-options-${field.id}`}
								type="text"
								value={field.options?.join(", ") || ""}
								onChange={(e) =>
									onUpdateField(
										field.id,
										{
											options: e.target.value
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean),
										},
										parentPath,
									)
								}
								placeholder="Option 1, Option 2, Option 3"
								className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
							/>
						</div>
					)}

					<div className="md:col-span-2">
						<label
							htmlFor={`field-help-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Help Text
						</label>
						<input
							id={`field-help-${field.id}`}
							type="text"
							value={field.helpText || ""}
							onChange={(e) =>
								onUpdateField(
									field.id,
									{
										helpText: e.target.value,
									},
									parentPath,
								)
							}
							placeholder="Optional hint for content editors"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>
				</div>

				{/* Nested fields for group */}
				{field.type === "group" && (
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between border-grey-200 border-t pt-4">
							<h4 className="font-medium text-grey-700 text-sm">
								Group Fields
							</h4>
							<button
								type="button"
								onClick={() => onAddNestedField(field.id, parentPath)}
								className="flex items-center gap-1 rounded bg-primary/10 px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/20"
								disabled={depth >= 1}
							>
								<Plus className="h-3 w-3" />
								Add Nested Field
							</button>
						</div>

						{field.fields && field.fields.length > 0 ? (
							<div className="space-y-3">
								{field.fields.map((nestedField, nestedIndex) => (
									<FieldEditor
										key={nestedField.id}
										field={nestedField}
										index={nestedIndex}
										depth={depth + 1}
										parentPath={currentPath}
										onUpdateField={onUpdateField}
										onRemoveField={onRemoveField}
										onAddNestedField={onAddNestedField}
										onMoveField={onMoveField}
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
		</div>
	)
}

export default function NewBlockPage() {
	const router = useRouter()
	const createBlock = useMutation(api.cms.blocks.create)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Block basic info
	const [displayName, setDisplayName] = useState("")
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [category, setCategory] = useState("")
	const [hasEditedName, setHasEditedName] = useState(false)

	// Fields
	const [fields, setFields] = useState<Field[]>([])

	// Auto-generate name from display name
	const generateName = (display: string) => {
		return display
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

	const handleDisplayNameChange = (value: string) => {
		setDisplayName(value)
		if (!hasEditedName) {
			setName(generateName(value))
		}
	}

	const handleNameChange = (value: string) => {
		setName(value)
		setHasEditedName(true)
	}

	const handleAddField = () => {
		const newField: Field = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: "shortText",
			required: false,
		}
		setFields([...fields, newField])

		// Scroll to bottom smoothly after adding field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}

	// Helper function to update nested fields recursively
	const updateNestedFields = useCallback(
		(
			fieldsArray: Field[],
			path: string[],
			updater: (field: Field) => Field,
		): Field[] => {
			if (path.length === 0) return fieldsArray

			const [currentId, ...restPath] = path

			return fieldsArray.map((field) => {
				if (field.id === currentId) {
					if (restPath.length === 0) {
						return updater(field)
					}
					if (field.fields) {
						return {
							...field,
							fields: updateNestedFields(field.fields, restPath, updater),
						}
					}
				}
				return field
			})
		},
		[],
	)

	const handleRemoveField = useCallback(
		(id: string, parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prev) => prev.filter((f) => f.id !== id))
			} else {
				// Nested field - recursively update
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.filter((f) => f.id !== id),
					})),
				)
			}
		},
		[updateNestedFields],
	)

	const handleUpdateField = useCallback(
		(id: string, updates: Partial<Field>, parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prevFields) =>
					prevFields.map((f) => {
						if (f.id === id) {
							const updated = { ...f, ...updates }
							// Reset nested fields if type changes from group
							if (f.type === "group" && updated.type !== "group") {
								delete updated.fields
							}
							// Initialize nested fields array if type changes to group
							if (updated.type === "group" && !updated.fields) {
								updated.fields = []
							}
							return updated
						}
						return f
					}),
				)
			} else {
				// Nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.map((f) => {
							if (f.id === id) {
								const updated = { ...f, ...updates }
								// Reset nested fields if type changes from group
								if (f.type === "group" && updated.type !== "group") {
									delete updated.fields
								}
								// Initialize nested fields array if type changes to group
								if (updated.type === "group" && !updated.fields) {
									updated.fields = []
								}
								return updated
							}
							return f
						}),
					})),
				)
			}
		},
		[updateNestedFields],
	)

	const handleAddNestedField = useCallback(
		(parentId: string, parentPath: string[] = []) => {
			const newField: Field = {
				id: `field_${Date.now()}`,
				name: "",
				label: "",
				type: "shortText",
				required: false,
			}

			if (parentPath.length === 0) {
				// Adding to top-level field
				setFields((prevFields) =>
					prevFields.map((f) => {
						if (f.id === parentId) {
							return {
								...f,
								fields: [...(f.fields || []), newField],
							}
						}
						return f
					}),
				)
			} else {
				// Adding to nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.map((f) => {
							if (f.id === parentId) {
								return {
									...f,
									fields: [...(f.fields || []), newField],
								}
							}
							return f
						}),
					})),
				)
			}

			// Scroll to bottom smoothly after adding nested field
			setTimeout(() => {
				window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
			}, 100)
		},
		[updateNestedFields],
	)

	const handleMoveField = useCallback(
		(id: string, direction: "up" | "down", parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prevFields) => {
					const index = prevFields.findIndex((f) => f.id === id)
					if (index === -1) return prevFields

					const newIndex = direction === "up" ? index - 1 : index + 1
					if (newIndex < 0 || newIndex >= prevFields.length) return prevFields

					const newFields = [...prevFields]
					;[newFields[index], newFields[newIndex]] = [
						newFields[newIndex],
						newFields[index],
					]
					return newFields
				})
			} else {
				// Nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => {
						if (!parentField.fields) return parentField

						const index = parentField.fields.findIndex((f) => f.id === id)
						if (index === -1) return parentField

						const newIndex = direction === "up" ? index - 1 : index + 1
						if (newIndex < 0 || newIndex >= parentField.fields.length)
							return parentField

						const newNestedFields = [...parentField.fields]
						;[newNestedFields[index], newNestedFields[newIndex]] = [
							newNestedFields[newIndex],
							newNestedFields[index],
						]

						return {
							...parentField,
							fields: newNestedFields,
						}
					}),
				)
			}
		},
		[updateNestedFields],
	)

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

			// Recursively include nested fields for group type
			if (f.type === "group" && f.fields) {
				mappedField.fields = mapFieldsForSave(f.fields)
			}

			return mappedField
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		try {
			// Validate
			if (!name.trim()) {
				throw new Error("Block name is required")
			}
			if (!displayName.trim()) {
				throw new Error("Display name is required")
			}
			if (fields.length === 0) {
				throw new Error("At least one field is required")
			}

			// Validate fields recursively
			const validateFields = (fieldsArray: Field[], level = 0): void => {
				// Check for duplicate field names at this level
				const fieldNames = new Set<string>()
				for (const field of fieldsArray) {
					if (!field.name.trim()) {
						throw new Error("All fields must have a name")
					}
					if (!field.label.trim()) {
						throw new Error("All fields must have a label")
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
						throw new Error(
							`Field "${field.label}" requires at least one option`,
						)
					}
					// Validate nested fields
					if (field.type === "group" && field.fields) {
						if (field.fields.length === 0) {
							throw new Error(
								`Group "${field.label}" must have at least one nested field`,
							)
						}
						validateFields(field.fields, level + 1)
					}
				}
			}

			validateFields(fields)

			// Create block with nested fields
			const blockId = await createBlock({
				name,
				displayName,
				description: description || undefined,
				fields: mapFieldsForSave(fields),
				category: category || undefined,
			})

			// Redirect to block detail
			router.push(`/blocks/${blockId}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create block")
		} finally {
			setLoading(false)
		}
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

			<div className="mb-6">
				<h1 className="font-bold text-3xl">Create Reusable Block</h1>
				<p className="mt-2 text-grey-500">
					Define a reusable component with its own fields
				</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-error-light/10 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Info */}
				<div className="rounded-lg bg-white p-6 shadow">
					<h2 className="mb-4 font-semibold text-lg">Basic Information</h2>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="block-display-name"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Display Name <span className="text-error">*</span>
							</label>
							<input
								id="block-display-name"
								type="text"
								value={displayName}
								onChange={(e) => handleDisplayNameChange(e.target.value)}
								placeholder="Call to Action"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
						</div>

						<div className="relative pb-6">
							<label
								htmlFor="block-name"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Block Name <span className="text-error">*</span>
							</label>
							<input
								id="block-name"
								type="text"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								placeholder="call_to_action"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
							<div className="-mt-3 absolute top-full left-0">
								{!hasEditedName && displayName ? (
									<p className="text-red-600 text-xs">
										✨ Auto-generated from "Display Name"
									</p>
								) : (
									<p className="text-grey-400 text-xs">
										Unique identifier (lowercase, underscores only)
									</p>
								)}
							</div>
						</div>

						<div>
							<label
								htmlFor="block-description"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Description
							</label>
							<textarea
								id="block-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Describe what this block is for..."
								rows={3}
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						<div>
							<label
								htmlFor="block-category"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Category
							</label>
							<input
								id="block-category"
								type="text"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								placeholder="Marketing"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>
				</div>

				{/* Fields */}
				<div className="mb-24 rounded-lg bg-white p-6 shadow">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg">
							Fields <span className="text-error">*</span>
						</h2>
					</div>

					{fields.length === 0 ? (
						<div className="rounded-lg border-2 border-grey-300 border-dashed p-8 text-center">
							<p className="text-grey-500">
								No fields yet. Click "Add Field" to get started.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{fields.map((field, index) => (
								<FieldEditor
									key={field.id}
									field={field}
									index={index}
									depth={0}
									parentPath={[]}
									onUpdateField={handleUpdateField}
									onRemoveField={handleRemoveField}
									onAddNestedField={handleAddNestedField}
									onMoveField={handleMoveField}
									totalFields={fields.length}
								/>
							))}
						</div>
					)}
				</div>

				{/* Floating Action Buttons */}
				<div className="fixed inset-x-0 bottom-0 z-10 border-grey-200 border-t bg-white p-4 shadow-lg">
					<div className="mx-auto flex max-w-4xl items-center justify-between">
						<button
							type="button"
							onClick={handleAddField}
							className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-white transition-colors hover:bg-secondary-dark"
						>
							<Plus className="h-4 w-4" />
							Add Field
						</button>

						<div className="flex items-center gap-4">
							<Link
								href="/blocks"
								className="rounded-lg border border-grey-300 px-6 py-2 text-grey-500 transition-colors hover:bg-grey-100"
							>
								Cancel
							</Link>
							<button
								type="submit"
								disabled={loading || fields.length === 0}
								className="rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							>
								{loading ? "Creating..." : "Create Block"}
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	)
}
