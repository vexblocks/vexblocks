"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Folder, Layers, Plus, Save, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getCleanErrorMessage } from "@/lib/error-utils"

// Dynamic import for Lexical to avoid SSR issues
const LexicalEditor = dynamic(
	() => import("@/components/editor/lexical-editor"),
	{ ssr: false },
)

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
	| "reference"
	| "multiReference"
	| "group"
	| "repeater"
	| "flexibleBlocks"
	| "blockReference"

type Field = {
	name: string
	label: string
	type: FieldType
	required: boolean
	helpText?: string
	options?: string[]
	referenceSchema?: string
	fields?: Field[]
	// For flexibleBlocks
	allowedBlocks?: string[]
	maxBlocks?: number
	// For blockReference
	blockId?: string
	// For shortText slug
	isSlug?: boolean
	slugSource?: string
}

// Helper to get nested value from contentData
function getNestedValue(obj: any, path: string): any {
	const keys = path.split(".")
	let value = obj
	for (const key of keys) {
		// Handle array indices like "menu_item[0]"
		const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
		if (arrayMatch) {
			const [, arrayKey, index] = arrayMatch
			value = value?.[arrayKey]?.[Number.parseInt(index, 10)]
		} else {
			value = value?.[key]
		}
		if (value === undefined) return undefined
	}
	return value
}

// Helper to set nested value in contentData (with deep cloning for arrays)
function setNestedValue(obj: any, path: string, value: any): any {
	const keys = path.split(".")

	// Deep clone using JSON (more reliable for nested structures)
	const newObj = JSON.parse(JSON.stringify(obj))
	let current = newObj

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i]
		// Handle array indices like "menu_item[0]"
		const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
		if (arrayMatch) {
			const [, arrayKey, index] = arrayMatch
			const idx = Number.parseInt(index, 10)
			// Ensure array exists and is cloned
			if (!current[arrayKey]) current[arrayKey] = []
			if (!Array.isArray(current[arrayKey])) current[arrayKey] = []
			// Ensure the specific index exists
			if (!current[arrayKey][idx]) current[arrayKey][idx] = {}
			current = current[arrayKey][idx]
		} else {
			// Ensure object exists
			if (
				!current[key] ||
				typeof current[key] !== "object" ||
				Array.isArray(current[key])
			) {
				current[key] = {}
			}
			current = current[key]
		}
	}

	const lastKey = keys[keys.length - 1]
	const arrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/)
	if (arrayMatch) {
		const [, arrayKey, index] = arrayMatch
		const idx = Number.parseInt(index, 10)
		if (!current[arrayKey]) current[arrayKey] = []
		current[arrayKey][idx] = value
	} else {
		current[lastKey] = value
	}

	return newObj
}

// Recursive FieldRenderer component
type FieldRendererProps = {
	field: Field
	path: string
	value: any
	onChange: (path: string, value: any) => void
	onAddRepeaterItem?: (path: string) => void
	onRemoveRepeaterItem?: (path: string, index: number) => void
	level?: number
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}

function FieldRenderer({
	field,
	path,
	value,
	onChange,
	onAddRepeaterItem,
	onRemoveRepeaterItem,
	level = 0,
	allSchemas,
	contentBySchema,
}: FieldRendererProps) {
	// Handle group fields
	if (field.type === "group") {
		return (
			<div
				className="rounded-lg border-2 border-grey-200 bg-grey-50 p-4"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center gap-2">
					<Folder className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
						Group
					</span>
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}
				<div className="space-y-4">
					{field.fields?.map((nestedField) => {
						const nestedPath = `${path}.${nestedField.name}`
						const nestedValue = getNestedValue(value || {}, nestedPath)
						return (
							<FieldRenderer
								key={nestedField.name}
								field={nestedField}
								path={nestedPath}
								value={nestedValue}
								onChange={onChange}
								onAddRepeaterItem={onAddRepeaterItem}
								onRemoveRepeaterItem={onRemoveRepeaterItem}
								level={level + 1}
								allSchemas={allSchemas}
								contentBySchema={contentBySchema}
							/>
						)
					})}
				</div>
			</div>
		)
	}

	// Handle flexibleBlocks fields
	if (field.type === "flexibleBlocks") {
		const blocks = (value || []) as Array<{
			_id: string
			type: string
			data: any
		}>

		const allowedTypes = field.allowedBlocks || [
			"shortText",
			"longText",
			"richText",
			"media",
			"url",
			"boolean",
			"number",
			"date",
			"select",
			"group",
			"blockReference",
		]

		const addBlock = (blockType: string) => {
			const newBlock = {
				_id: `block_${Date.now()}`,
				type: blockType,
				data: blockType === "boolean" ? false : blockType === "number" ? 0 : "",
			}
			const newBlocks = [...blocks, newBlock]
			onChange(path, newBlocks)
		}

		const removeBlock = (blockId: string) => {
			onChange(
				path,
				blocks.filter((b) => b._id !== blockId),
			)
		}

		const updateBlock = (blockId: string, data: any) => {
			onChange(
				path,
				blocks.map((b) => (b._id === blockId ? { ...b, data } : b)),
			)
		}

		const moveBlock = (index: number, direction: "up" | "down") => {
			const newIndex = direction === "up" ? index - 1 : index + 1
			if (newIndex < 0 || newIndex >= blocks.length) return
			const newBlocks = [...blocks]
			;[newBlocks[index], newBlocks[newIndex]] = [
				newBlocks[newIndex],
				newBlocks[index],
			]
			onChange(path, newBlocks)
		}

		const canAddMore = !field.maxBlocks || blocks.length < field.maxBlocks

		return (
			<div
				className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="h-5 w-5 text-purple-600" />
						<h3 className="font-semibold text-grey-900 text-lg">
							{field.label}
						</h3>
						<span className="rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-600 text-xs">
							Flexible Blocks
						</span>
						{field.required && <span className="text-error text-sm">*</span>}
					</div>
					{canAddMore && (
						<div className="relative">
							<select
								onChange={(e) => {
									if (e.target.value) {
										addBlock(e.target.value)
										e.target.value = ""
									}
								}}
								className="rounded border border-purple-300 bg-white px-3 py-1.5 text-purple-600 text-sm transition-colors hover:bg-purple-50"
							>
								<option value="">+ Add Block</option>
								{allowedTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}
				{field.maxBlocks && (
					<p className="mb-4 text-grey-500 text-xs">
						Maximum: {field.maxBlocks} blocks ({blocks.length}/{field.maxBlocks}{" "}
						used)
					</p>
				)}

				{blocks.length === 0 ? (
					<div className="rounded-lg border-2 border-grey-300 border-dashed bg-white p-8 text-center">
						<p className="text-grey-400 text-sm">
							No blocks yet. Select a block type to add.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{blocks.map((block, index) => (
							<div
								key={block._id}
								className="rounded-lg border border-purple-300 bg-white p-4 shadow-sm"
							>
								<div className="mb-3 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-purple-600 text-xs">
											{block.type}
										</span>
										<span className="text-grey-500 text-xs">
											Block #{index + 1}
										</span>
									</div>
									<div className="flex items-center gap-1">
										{index > 0 && (
											<button
												type="button"
												onClick={() => moveBlock(index, "up")}
												className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100"
												title="Move up"
											>
												↑
											</button>
										)}
										{index < blocks.length - 1 && (
											<button
												type="button"
												onClick={() => moveBlock(index, "down")}
												className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100"
												title="Move down"
											>
												↓
											</button>
										)}
										<button
											type="button"
											onClick={() => removeBlock(block._id)}
											className="text-error transition-colors hover:text-error/80"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
								{renderBasicField(
									{ ...field, type: block.type as any, required: false },
									block.data,
									(newData) => updateBlock(block._id, newData),
									`${path}-${block._id}`,
									allSchemas,
									contentBySchema,
								)}
							</div>
						))}
					</div>
				)}
			</div>
		)
	}

	// Handle blockReference fields
	if (field.type === "blockReference") {
		// We need to get the block definition from availableBlocks
		// For now, let's render a placeholder indicating this needs implementation
		return (
			<div
				className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center gap-2">
					<Layers className="h-5 w-5 text-blue-600" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600 text-xs">
						Block Reference
					</span>
					{field.required && <span className="text-error text-sm">*</span>}
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}
				<div className="rounded-lg border border-blue-300 bg-white p-4">
					<p className="mb-2 text-grey-600 text-sm">
						Block ID: <code className="text-blue-600">{field.blockId}</code>
					</p>
					<p className="text-grey-500 text-xs">
						Block Reference fields render the referenced block's fields here.
						This will be fully implemented when blocks are loaded dynamically.
					</p>
					<textarea
						value={
							typeof value === "string"
								? value
								: JSON.stringify(value || {}, null, 2)
						}
						onChange={(e) => {
							try {
								const parsed = JSON.parse(e.target.value)
								onChange(path, parsed)
							} catch {
								onChange(path, e.target.value)
							}
						}}
						rows={6}
						className="mt-3 w-full rounded border border-blue-300 p-2 font-mono text-xs"
						placeholder='{"field": "value"}'
					/>
				</div>
			</div>
		)
	}

	// Handle repeater fields
	if (field.type === "repeater") {
		const items = (value || []) as any[]

		return (
			<div
				className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="h-5 w-5 text-primary" />
						<h3 className="font-semibold text-grey-900 text-lg">
							{field.label}
						</h3>
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							Repeater
						</span>
						{field.required && <span className="text-error text-sm">*</span>}
					</div>
					<button
						type="button"
						onClick={() => onAddRepeaterItem?.(path)}
						className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-800"
					>
						<Plus className="h-4 w-4" />
						Add Item
					</button>
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}

				{items.length === 0 ? (
					<div className="rounded-lg border-2 border-grey-300 border-dashed bg-white p-8 text-center">
						<p className="text-grey-400 text-sm">
							No items yet. Click "Add Item" to get started.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{items.map((item, index) => (
							<div
								key={index}
								className="rounded-lg border border-grey-300 bg-white p-4 shadow-sm"
							>
								<div className="mb-3 flex items-center justify-between">
									<h4 className="font-medium text-grey-700 text-sm">
										Item #{index + 1}
									</h4>
									<button
										type="button"
										onClick={() => onRemoveRepeaterItem?.(path, index)}
										className="text-error transition-colors hover:text-error/80"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
								<div className="space-y-4">
									{field.fields?.map((nestedField) => {
										const nestedPath = `${path}[${index}].${nestedField.name}`
										// Get value from the item object directly (not from global contentData)
										const nestedValue = item?.[nestedField.name]
										return (
											<FieldRenderer
												key={`${nestedField.name}-${index}`}
												field={nestedField}
												path={nestedPath}
												value={nestedValue}
												onChange={onChange}
												onAddRepeaterItem={onAddRepeaterItem}
												onRemoveRepeaterItem={onRemoveRepeaterItem}
												level={level + 1}
												allSchemas={allSchemas}
												contentBySchema={contentBySchema}
											/>
										)
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		)
	}

	// Handle regular fields
	const fieldId = `field-${path.replace(/\./g, "-").replace(/\[/g, "-").replace(/\]/g, "")}`

	// Ensure value has a default based on field type
	const fieldValue =
		value ??
		(field.type === "number" ? 0 : field.type === "boolean" ? false : "")

	return (
		<div style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}>
			<label
				htmlFor={fieldId}
				className="mb-2 block font-medium text-grey-500 text-sm"
			>
				{field.label}
				{field.required && <span className="text-error"> *</span>}
			</label>
			{renderBasicField(
				field,
				fieldValue,
				(val) => onChange(path, val),
				fieldId,
				allSchemas,
				contentBySchema,
			)}
			{field.helpText && (
				<p className="mt-1 text-grey-400 text-xs">{field.helpText}</p>
			)}
		</div>
	)
}

// Render basic (non-nested) fields
function renderBasicField(
	field: Field,
	value: any,
	onChange: (value: any) => void,
	fieldId: string,
	allSchemas?: any[],
	allContent?: Record<string, any[]>,
) {
	switch (field.type) {
		case "shortText":
			return (
				<div>
					<input
						type="text"
						id={fieldId}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={field.helpText}
						required={field.required}
						readOnly={field.isSlug}
						className={`w-full rounded-lg border px-4 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
							field.isSlug
								? "border-blue-300 bg-blue-50 text-blue-900"
								: "border-grey-300 text-grey-500"
						}`}
					/>
					{field.isSlug && field.slugSource && (
						<p className="mt-1 text-blue-600 text-xs">
							✨ Auto-generated from "{field.slugSource}"
						</p>
					)}
				</div>
			)

		case "longText":
			return (
				<textarea
					id={fieldId}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.helpText}
					required={field.required}
					rows={4}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "richText":
			return (
				<LexicalEditor
					value={value}
					onChange={onChange}
					placeholder={field.helpText || "Enter rich text content..."}
				/>
			)

		case "number":
			return (
				<input
					type="number"
					id={fieldId}
					value={value}
					onChange={(e) => onChange(Number.parseFloat(e.target.value))}
					placeholder={field.helpText}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "boolean":
			return (
				<label className="flex items-center gap-3">
					<input
						type="checkbox"
						id={fieldId}
						checked={value || false}
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
					value={value}
					onChange={(e) => onChange(e.target.value)}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "url":
			return (
				<input
					type="text"
					id={fieldId}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.helpText || "https://example.com or /about"}
					required={field.required}
					pattern="^(https?:\/\/.+|\/.*|#.*)$"
					title="Enter a full URL (https://...) or a relative path (/about, #section)"
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)

		case "select":
			return (
				<select
					id={fieldId}
					value={value}
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
				<div className="rounded-lg border-2 border-grey-300 border-dashed p-8 text-center">
					<p className="text-grey-500 text-sm">
						Media picker will be implemented in the media center
					</p>
					<input
						type="text"
						id={fieldId}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Enter media URL for now..."
						className="mt-4 w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500"
					/>
				</div>
			)

		case "reference": {
			// Find the referenced schema and its content
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
						// Try to find a good display field (title, name, or first text field)
						const displayValue =
							item.data?.title ||
							item.data?.name ||
							item.data?.displayName ||
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

		case "multiReference": {
			// Find the referenced schema and its content
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
									item.data?.title ||
									item.data?.name ||
									item.data?.displayName ||
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
					<p className="text-grey-400 text-xs">
						{selectedIds.length} {referencedSchema.displayName} selected
					</p>
				</div>
			)
		}

		default:
			return (
				<input
					type="text"
					id={fieldId}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={field.helpText}
					required={field.required}
					className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			)
	}
}

export default function NewContentPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const preselectedSchema = searchParams.get("schema")

	const schemas = useQuery(api.cms.schemas.list)
	const _availableBlocks = useQuery(api.cms.blocks.list)
	const allContent = useQuery(api.cms.content.listAll) // Load all content for references
	const createContent = useMutation(api.cms.content.create)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	const [selectedSchemaId, setSelectedSchemaId] = useState(
		preselectedSchema || "",
	)
	const [status, setStatus] = useState<"draft" | "published">("draft")
	const [contentData, setContentData] = useState<Record<string, any>>({})
	const [seoTitle, setSeoTitle] = useState("")
	const [seoDescription, setSeoDescription] = useState("")

	const selectedSchema = schemas?.find((s) => s._id === selectedSchemaId)

	// Organize content by schema name for quick lookup
	const contentBySchema = (allContent || []).reduce(
		(acc: Record<string, any[]>, item: any) => {
			const schema = schemas?.find((s) => s._id === item.schemaId)
			if (schema) {
				if (!acc[schema.name]) acc[schema.name] = []
				acc[schema.name].push(item)
			}
			return acc
		},
		{},
	)

	// Auto-generate slug from slug field
	useEffect(() => {
		if (!selectedSchema?.fields) return

		// Find slug field in schema
		const slugField = selectedSchema.fields.find(
			(f: Field) => f.type === "shortText" && f.isSlug && f.slugSource,
		)

		if (slugField?.slugSource) {
			const sourceValue = contentData[slugField.slugSource]
			if (sourceValue && typeof sourceValue === "string") {
				const autoSlug = sourceValue
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, "")

				// Only update the slug field if it's different from current value
				if (contentData[slugField.name] !== autoSlug) {
					setContentData((prev) => ({
						...prev,
						[slugField.name]: autoSlug,
					}))
				}
			}
		}
	}, [contentData, selectedSchema])

	const handleFieldChange = useCallback((path: string, value: any) => {
		setContentData((prev) => setNestedValue(prev, path, value))
	}, [])

	const handleAddRepeaterItem = useCallback((path: string) => {
		setContentData((prev) => {
			const currentValue = getNestedValue(prev, path) || []
			const newItem = {} // Empty object for new item
			return setNestedValue(prev, path, [...currentValue, newItem])
		})
	}, [])

	const handleRemoveRepeaterItem = useCallback(
		(path: string, index: number) => {
			setContentData((prev) => {
				const currentValue = getNestedValue(prev, path) || []
				const newValue = currentValue.filter((_: any, i: number) => i !== index)
				return setNestedValue(prev, path, newValue)
			})
		},
		[],
	)

	// Validate fields recursively
	const validateFields = useCallback(
		(fields: Field[], data: any, parentPath = ""): string | null => {
			for (const field of fields) {
				const fieldPath = parentPath
					? `${parentPath}.${field.name}`
					: field.name
				const value = getNestedValue(data, fieldPath)

				if (field.required) {
					if (field.type === "repeater") {
						if (!value || !Array.isArray(value) || value.length === 0) {
							return `${field.label} requires at least one item`
						}
					} else if (field.type === "group") {
						if (!value || typeof value !== "object") {
							return `${field.label} is required`
						}
					} else {
						if (value === undefined || value === null || value === "") {
							return `${field.label} is required`
						}
					}
				}

				// Validate nested fields
				if (field.type === "group" && field.fields) {
					const error = validateFields(field.fields, data, fieldPath)
					if (error) return error
				} else if (field.type === "repeater" && field.fields && value) {
					for (let i = 0; i < value.length; i++) {
						const error = validateFields(
							field.fields,
							data,
							`${fieldPath}[${i}]`,
						)
						if (error) return error
					}
				}
			}
			return null
		},
		[],
	)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		try {
			if (!selectedSchemaId) {
				throw new Error("Please select a schema")
			}

			// Validate required fields recursively
			const validationError = validateFields(
				selectedSchema?.fields || [],
				contentData,
			)
			if (validationError) {
				throw new Error(validationError)
			}

			await createContent({
				schemaId: selectedSchemaId as Id<"cmsSchemas">,
				status,
				data: contentData,
				seo:
					seoTitle || seoDescription
						? {
								title: seoTitle || undefined,
								description: seoDescription || undefined,
							}
						: undefined,
			})

			router.push("/content")
		} catch (err) {
			setError(getCleanErrorMessage(err, "Failed to create content"))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<Link
					href="/content"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Content
				</Link>
			</div>

			<div className="mb-6">
				<h1 className="font-bold text-3xl text-primary">Create New Content</h1>
				<p className="mt-2 text-grey-500">Add a new content entry</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-red-50 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Schema Selection */}
				<div className="rounded-lg bg-white p-6 shadow">
					<label
						htmlFor="schema-select"
						className="mb-2 block font-medium text-grey-500 text-sm"
					>
						Schema <span className="text-error">*</span>
					</label>
					<select
						id="schema-select"
						value={selectedSchemaId}
						onChange={(e) => {
							setSelectedSchemaId(e.target.value)
							setContentData({}) // Reset content data when schema changes
						}}
						required
						className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					>
						<option value="">Select a schema...</option>
						{schemas?.map((schema) => (
							<option key={schema._id} value={schema._id}>
								{schema.displayName} ({schema.type})
							</option>
						))}
					</select>
				</div>

				{/* Content Fields */}
				{selectedSchema && (
					<>
						<div className="rounded-lg bg-white p-6 shadow">
							<h2 className="mb-4 font-semibold text-lg text-primary">
								Content Fields
							</h2>
							<div className="space-y-6">
								{selectedSchema.fields.map((field: any) => (
									<FieldRenderer
										key={field.name}
										field={field}
										path={field.name}
										value={getNestedValue(contentData, field.name)}
										onChange={handleFieldChange}
										onAddRepeaterItem={handleAddRepeaterItem}
										onRemoveRepeaterItem={handleRemoveRepeaterItem}
										allSchemas={schemas || []}
										contentBySchema={contentBySchema}
									/>
								))}
							</div>
						</div>

						{/* SEO (only for pages and collections, not global) */}
						{selectedSchema.type !== "global" && (
							<div className="rounded-lg bg-white p-6 shadow">
								<h2 className="mb-4 font-semibold text-lg text-primary">
									SEO Metadata
								</h2>
								<div className="space-y-4">
									<div>
										<label
											htmlFor="seo-title"
											className="mb-2 block font-medium text-grey-500 text-sm"
										>
											SEO Title
										</label>
										<input
											type="text"
											id="seo-title"
											value={seoTitle}
											onChange={(e) => setSeoTitle(e.target.value)}
											placeholder="Page title for search engines"
											className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										/>
									</div>
									<div>
										<label
											htmlFor="seo-description"
											className="mb-2 block font-medium text-grey-500 text-sm"
										>
											SEO Description
										</label>
										<textarea
											id="seo-description"
											value={seoDescription}
											onChange={(e) => setSeoDescription(e.target.value)}
											placeholder="Page description for search engines"
											rows={3}
											className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
										/>
									</div>
								</div>
							</div>
						)}

						{/* Status */}
						<div className="rounded-lg bg-white p-6 shadow">
							<h2 className="mb-4 font-semibold text-lg text-primary">
								Publication Status
							</h2>
							<div className="flex gap-4">
								<label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border-2 border-grey-300 p-4 transition-colors hover:border-primary">
									<input
										type="radio"
										name="status"
										value="draft"
										checked={status === "draft"}
										onChange={(e) => setStatus(e.target.value as any)}
										className="h-4 w-4"
									/>
									<div>
										<div className="font-medium text-primary">Draft</div>
										<div className="text-grey-500 text-sm">
											Save as draft (not visible publicly)
										</div>
									</div>
								</label>
								<label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border-2 border-grey-300 p-4 transition-colors hover:border-primary">
									<input
										type="radio"
										name="status"
										value="published"
										checked={status === "published"}
										onChange={(e) => setStatus(e.target.value as any)}
										className="h-4 w-4"
									/>
									<div>
										<div className="font-medium text-primary">Published</div>
										<div className="text-grey-500 text-sm">
											Publish immediately (visible publicly)
										</div>
									</div>
								</label>
							</div>
						</div>
					</>
				)}

				{/* Submit */}
				<div className="flex items-center justify-end gap-4">
					<Link
						href="/content"
						className="rounded-lg border border-grey-300 px-6 py-3 text-grey-500 transition-colors hover:bg-grey-100"
					>
						Cancel
					</Link>
					<button
						type="submit"
						disabled={loading || !selectedSchemaId}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						<Save className="h-4 w-4" />
						{loading ? "Creating..." : "Create Content"}
					</button>
				</div>
			</form>
		</div>
	)
}
