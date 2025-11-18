"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import Link from "next/link"
import {
	ArrowLeft,
	Save,
	Trash2,
	AlertTriangle,
	Plus,
	X,
	Folder,
	Layers,
} from "lucide-react"
import dynamic from "next/dynamic"
import { getCleanErrorMessage } from "@/lib/error-utils"

const LexicalEditor = dynamic(
	() => import("@/components/editor/lexical-editor"),
	{ ssr: false },
)

// Helper functions for nested data manipulation
function getNestedValue(obj: any, path: string): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)
	let current = obj
	for (const key of keys) {
		if (current === undefined || current === null) return undefined
		current = current[key]
	}
	return current
}

function setNestedValue(obj: any, path: string, value: any): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)
	// Deep clone to prevent reference issues that cause input focus loss
	const newObj = JSON.parse(JSON.stringify(obj))
	let current = newObj

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i]
		if (!(key in current)) {
			const nextKey = keys[i + 1]
			current[key] = /^\d+$/.test(nextKey) ? [] : {}
		}
		current = current[key]
	}

	const lastKey = keys[keys.length - 1]
	current[lastKey] = value

	return newObj
}

type Field = {
	name: string
	label: string
	type: string
	required?: boolean
	helpText?: string
	options?: string[]
	referenceSchema?: string
	fields?: Field[]
	isSlug?: boolean
	slugSource?: string
}

// Render basic field types (moved outside to prevent re-creation)
function renderBasicField(
	field: Field,
	path: string,
	value: any,
	fieldId: string,
	contentId: string,
	onChange: (newValue: any) => void,
	allSchemas?: any[],
	allContent?: Record<string, any[]>,
) {
	// Provide consistent default based on type to prevent uncontrolled component warnings
	const defaultValue =
		value ??
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
					value={defaultValue}
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
					key={`${contentId}-${path}`}
					value={defaultValue}
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

		case "url":
			return (
				<input
					type="text"
					id={fieldId}
					value={defaultValue}
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
				<div className="rounded-lg border-2 border-dashed border-grey-300 p-8 text-center">
					<p className="text-grey-500 text-sm">
						Media picker will be implemented in the media center
					</p>
					<input
						type="text"
						id={fieldId}
						value={defaultValue}
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
					{selectedIds.length > 0 && (
						<p className="text-grey-500 text-xs">
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

// Recursive field renderer (moved outside to prevent re-creation)
function FieldRenderer({
	field,
	parentPath = "",
	level = 0,
	contentData,
	contentId,
	onFieldChange,
	onAddRepeaterItem,
	onRemoveRepeaterItem,
	allSchemas,
	allContent,
}: {
	field: Field
	parentPath?: string
	level?: number
	contentData: Record<string, any>
	contentId: string
	onFieldChange: (path: string, value: any) => void
	onAddRepeaterItem: (path: string, field: Field) => void
	onRemoveRepeaterItem: (path: string, index: number) => void
	allSchemas?: any[]
	allContent?: Record<string, any[]>
}) {
	const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
	const fieldValue = getNestedValue(contentData, fieldPath)
	const fieldId = `field-${fieldPath.replace(/[.\[\]]/g, "-")}`

	// Handle GROUP type
	if (field.type === "group" && field.fields) {
		return (
			<div
				className="space-y-4 rounded-lg border-2 border-grey-200 bg-grey-50 p-4"
				style={{ marginLeft: `${level * 16}px` }}
			>
				<div className="mb-3 flex items-center gap-2">
					<Folder className="h-5 w-5 text-primary" />
					<span className="font-medium text-grey-800 text-sm">
						{field.label}
					</span>
					{field.required && <span className="text-error text-sm">*</span>}
					<span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
						Group
					</span>
				</div>
				{field.helpText && (
					<p className="mb-3 text-grey-500 text-xs">{field.helpText}</p>
				)}
				<div className="space-y-4">
					{field.fields.map((nestedField) => (
						<FieldRenderer
							key={nestedField.name}
							field={nestedField}
							parentPath={fieldPath}
							level={level + 1}
							contentData={contentData}
							contentId={contentId}
							onFieldChange={onFieldChange}
							onAddRepeaterItem={onAddRepeaterItem}
							onRemoveRepeaterItem={onRemoveRepeaterItem}
							allSchemas={allSchemas}
							allContent={allContent}
						/>
					))}
				</div>
			</div>
		)
	}

	// Handle REPEATER type
	if (field.type === "repeater" && field.fields) {
		const items = (fieldValue as any[]) || []

		return (
			<div
				className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
				style={{ marginLeft: `${level * 16}px` }}
			>
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="h-5 w-5 text-primary" />
						<span className="font-medium text-grey-800 text-sm">
							{field.label}
						</span>
						{field.required && <span className="text-error text-sm">*</span>}
						<span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
							Repeater
						</span>
					</div>
					<button
						type="button"
						onClick={() => onAddRepeaterItem(fieldPath, field)}
						className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-white text-xs transition-colors hover:bg-primary-800"
					>
						<Plus className="h-3 w-3" />
						Add Item
					</button>
				</div>
				{field.helpText && (
					<p className="mb-3 text-grey-500 text-xs">{field.helpText}</p>
				)}
				<div className="space-y-4">
					{items.map((item, index) => (
						<div
							key={index}
							className="space-y-3 rounded-lg border border-grey-300 bg-white p-4"
						>
							<div className="mb-2 flex items-center justify-between">
								<span className="font-medium text-grey-700 text-sm">
									Item {index + 1}
								</span>
								<button
									type="button"
									onClick={() => onRemoveRepeaterItem(fieldPath, index)}
									className="text-error hover:text-error-light"
									title="Remove item"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							{field.fields?.map((nestedField) => (
								<FieldRenderer
									key={nestedField.name}
									field={nestedField}
									parentPath={`${fieldPath}[${index}]`}
									level={level + 1}
									contentData={contentData}
									contentId={contentId}
									onFieldChange={onFieldChange}
									onAddRepeaterItem={onAddRepeaterItem}
									onRemoveRepeaterItem={onRemoveRepeaterItem}
									allSchemas={allSchemas}
									allContent={allContent}
								/>
							))}
						</div>
					))}
					{items.length === 0 && (
						<p className="text-center text-grey-400 text-sm">
							No items yet. Click "Add Item" to create one.
						</p>
					)}
				</div>
			</div>
		)
	}

	// Handle basic field types
	return (
		<div style={{ marginLeft: `${level * 16}px` }}>
			<label
				htmlFor={fieldId}
				className="mb-2 block text-sm font-medium text-grey-500"
			>
				{field.label}
				{field.required && <span className="text-error"> *</span>}
			</label>
			{renderBasicField(
				field,
				fieldPath,
				fieldValue,
				fieldId,
				contentId,
				(newValue) => onFieldChange(fieldPath, newValue),
				allSchemas,
				allContent,
			)}
			{field.helpText && (
				<p className="mt-1 text-xs text-grey-400">{field.helpText}</p>
			)}
		</div>
	)
}

// Recursive validation function
function validateFields(
	fields: Field[],
	data: any,
	parentPath = "",
): string | null {
	for (const field of fields) {
		const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
		const value = getNestedValue(data, fieldPath)

		if (field.type === "group" && field.fields) {
			const groupError = validateFields(field.fields, data, fieldPath)
			if (groupError) return groupError
		} else if (field.type === "repeater" && field.fields) {
			if (field.required && (!value || value.length === 0)) {
				return `${field.label} must have at least one item`
			}
			if (Array.isArray(value)) {
				for (let i = 0; i < value.length; i++) {
					const itemError = validateFields(
						field.fields,
						data,
						`${fieldPath}[${i}]`,
					)
					if (itemError) return itemError
				}
			}
		} else {
			if (field.required && !value && value !== 0 && value !== false) {
				return `${field.label} is required`
			}
		}
	}
	return null
}

export default function EditContentPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const router = useRouter()
	const content = useQuery(api.cms.content.get, {
		id: id as Id<"cmsContent">,
	})
	const schema = useQuery(
		api.cms.schemas.get,
		content ? { id: content.schemaId } : "skip",
	)
	const schemas = useQuery(api.cms.schemas.list)
	const allContent = useQuery(api.cms.content.listAll)
	const updateContent = useMutation(api.cms.content.update)
	const deleteContent = useMutation(api.cms.content.remove)

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const [status, setStatus] = useState<"draft" | "published">("draft")
	const [slug, setSlug] = useState("")
	const [contentData, setContentData] = useState<Record<string, any>>({})
	const [seoTitle, setSeoTitle] = useState("")
	const [seoDescription, setSeoDescription] = useState("")

	// Organize content by schema name for quick lookup
	const contentBySchema = (allContent || []).reduce(
		(acc: Record<string, any[]>, item: any) => {
			const itemSchema = schemas?.find((s) => s._id === item.schemaId)
			if (itemSchema) {
				if (!acc[itemSchema.name]) acc[itemSchema.name] = []
				acc[itemSchema.name].push(item)
			}
			return acc
		},
		{},
	)

	// Initialize form with existing content
	useEffect(() => {
		if (content) {
			setStatus(content.status)
			setSlug(content.slug || "")
			setContentData(content.data || {})
			setSeoTitle(content.seo?.title || "")
			setSeoDescription(content.seo?.description || "")
		}
	}, [content])

	const handleFieldChange = useCallback((path: string, value: any) => {
		setContentData((prev) => setNestedValue(prev, path, value))
	}, [])

	const handleAddRepeaterItem = useCallback((path: string, field: Field) => {
		setContentData((prev) => {
			const currentArray = getNestedValue(prev, path) || []
			const newItem: Record<string, any> = {}

			// Initialize new item with default values based on nested field types
			if (field.fields) {
				for (const nestedField of field.fields) {
					if (nestedField.type === "number") {
						newItem[nestedField.name] = 0
					} else if (nestedField.type === "boolean") {
						newItem[nestedField.name] = false
					} else if (nestedField.type === "repeater") {
						newItem[nestedField.name] = []
					} else if (nestedField.type === "group") {
						newItem[nestedField.name] = {}
					} else {
						newItem[nestedField.name] = ""
					}
				}
			}

			return setNestedValue(prev, path, [...currentArray, newItem])
		})
	}, [])

	const handleRemoveRepeaterItem = useCallback(
		(path: string, index: number) => {
			setContentData((prev) => {
				const currentArray = getNestedValue(prev, path) || []
				const newArray = currentArray.filter((_: any, i: number) => i !== index)
				return setNestedValue(prev, path, newArray)
			})
		},
		[],
	)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		try {
			// Recursive validation
			const validationError = validateFields(schema?.fields || [], contentData)
			if (validationError) {
				throw new Error(validationError)
			}

			await updateContent({
				id: id as Id<"cmsContent">,
				slug: slug || undefined,
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
			setError(getCleanErrorMessage(err, "Failed to update content"))
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		setLoading(true)
		try {
			await deleteContent({ id: id as Id<"cmsContent"> })
			router.push("/content")
		} catch (err) {
			setError(getCleanErrorMessage(err, "Failed to delete content"))
			setLoading(false)
		}
	}

	if (content === undefined || schema === undefined) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading content...</p>
				</div>
			</div>
		)
	}

	if (content === null || schema === null) {
		return (
			<div className="text-center">
				<h1 className="mb-4 text-2xl font-bold text-primary">
					Content Not Found
				</h1>
				<Link href="/content" className="text-primary hover:underline">
					← Back to Content
				</Link>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6 flex items-center justify-between">
				<Link
					href="/content"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Content
				</Link>

				<button
					type="button"
					onClick={() => setShowDeleteConfirm(true)}
					className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-error transition-colors hover:bg-error hover:text-white"
				>
					<Trash2 className="h-4 w-4" />
					Delete
				</button>
			</div>

			<div className="mb-6">
				<h1 className="text-3xl font-bold text-primary">Edit Content</h1>
				<p className="mt-2 text-grey-500">{schema.displayName}</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-error-light/10 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light/20">
								<AlertTriangle className="h-6 w-6 text-error" />
							</div>
							<h3 className="text-lg font-semibold text-primary">
								Delete Content
							</h3>
						</div>
						<p className="mb-6 text-grey-500">
							Are you sure you want to delete this content? This action cannot
							be undone.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors hover:bg-grey-100"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={loading}
								className="rounded-lg bg-error px-4 py-2 text-white transition-colors hover:bg-error-light disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete Content"}
							</button>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Content Fields */}
				<div className="rounded-lg bg-white p-6 shadow-md">
					<h2 className="mb-4 text-lg font-semibold text-primary">
						Content Fields
					</h2>
					<div className="space-y-6">
						{schema.fields.map((field: any) => (
							<FieldRenderer
								key={field.name}
								field={field}
								contentData={contentData}
								contentId={id}
								onFieldChange={handleFieldChange}
								onAddRepeaterItem={handleAddRepeaterItem}
								onRemoveRepeaterItem={handleRemoveRepeaterItem}
								allSchemas={schemas || []}
								allContent={contentBySchema}
							/>
						))}
					</div>
				</div>

				{/* Slug */}
				{(schema.type === "page" || schema.type === "collection") && (
					<div className="rounded-lg bg-white p-6 shadow-md">
						<h2 className="mb-4 text-lg font-semibold text-primary">
							URL Slug
						</h2>
						<input
							type="text"
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="my-page-slug"
							className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						/>
					</div>
				)}

				{/* SEO */}
				{schema.type !== "global" && (
					<div className="rounded-lg bg-white p-6 shadow-md">
						<h2 className="mb-4 text-lg font-semibold text-primary">
							SEO Metadata
						</h2>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="seo-title"
									className="mb-2 block text-sm font-medium text-grey-500"
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
									className="mb-2 block text-sm font-medium text-grey-500"
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
				<div className="rounded-lg bg-white p-6 shadow-md">
					<h2 className="mb-4 text-lg font-semibold text-primary">
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
								<div className="text-sm text-grey-500">
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
								<div className="text-sm text-grey-500">
									Publish immediately (visible publicly)
								</div>
							</div>
						</label>
					</div>
				</div>

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
						disabled={loading}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						<Save className="h-4 w-4" />
						{loading ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	)
}
