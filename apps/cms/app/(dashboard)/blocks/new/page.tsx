"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useMutation } from "convex/react"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

type FieldType =
	| "shortText"
	| "longText"
	| "richText"
	| "media"
	| "url"
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
}) => {
	const currentPath = [...parentPath, field.id]
	const indentClass = depth > 0 ? `ml-${depth * 4}` : ""
	const borderColor = depth === 0 ? "border-grey-200" : "border-primary/30"
	const bgColor = depth === 0 ? "bg-white" : "bg-primary/5"

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
					<button
						type="button"
						onClick={() => onRemoveField(field.id, parentPath)}
						className="text-error transition-colors hover:text-error-light"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
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
							onChange={(e) =>
								onUpdateField(field.id, { name: e.target.value }, parentPath)
							}
							placeholder="title"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>

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
							onChange={(e) =>
								onUpdateField(field.id, { label: e.target.value }, parentPath)
							}
							placeholder="Post Title"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
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
	const [name, setName] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [description, setDescription] = useState("")
	const [icon, setIcon] = useState("")
	const [category, setCategory] = useState("")

	// Fields
	const [fields, setFields] = useState<Field[]>([])

	const handleAddField = () => {
		const newField: Field = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: "shortText",
			required: false,
		}
		setFields([...fields, newField])
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
				for (const field of fieldsArray) {
					if (!field.name.trim()) {
						throw new Error("All fields must have a name")
					}
					if (!field.label.trim()) {
						throw new Error("All fields must have a label")
					}
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
				name: name.toLowerCase().replace(/\s+/g, "_"),
				displayName,
				description: description || undefined,
				fields: mapFieldsForSave(fields),
				icon: icon || undefined,
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
				<h1 className="font-bold text-3xl text-primary">
					Create Reusable Block
				</h1>
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
					<h2 className="mb-4 font-semibold text-lg text-primary">
						Basic Information
					</h2>

					<div className="space-y-4">
						<div>
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
								onChange={(e) => setName(e.target.value)}
								placeholder="call_to_action"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
							<p className="mt-1 text-grey-400 text-xs">
								Unique identifier (lowercase, underscores only)
							</p>
						</div>

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
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Call to Action"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
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

						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label
									htmlFor="block-icon"
									className="mb-2 block font-medium text-grey-500 text-sm"
								>
									Icon (emoji)
								</label>
								<input
									id="block-icon"
									type="text"
									value={icon}
									onChange={(e) => setIcon(e.target.value)}
									placeholder="📢"
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
				</div>

				{/* Fields */}
				<div className="rounded-lg bg-white p-6 shadow">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg text-primary">
							Fields <span className="text-error">*</span>
						</h2>
						<button
							type="button"
							onClick={handleAddField}
							className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-white transition-colors hover:bg-secondary-dark"
						>
							<Plus className="h-4 w-4" />
							Add Field
						</button>
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
								/>
							))}
						</div>
					)}
				</div>

				{/* Submit */}
				<div className="flex items-center justify-end gap-4">
					<Link
						href="/blocks"
						className="rounded-lg border border-grey-300 px-6 py-3 text-grey-500 transition-colors hover:bg-grey-100"
					>
						Cancel
					</Link>
					<button
						type="submit"
						disabled={loading || fields.length === 0}
						className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create Block"}
					</button>
				</div>
			</form>
		</div>
	)
}
