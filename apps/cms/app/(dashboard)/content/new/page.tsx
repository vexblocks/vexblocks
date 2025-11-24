"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { FieldRenderer } from "../_components/field-renderer"
import type { Field } from "../_components/types"
import { getNestedValue, setNestedValue } from "../_components/utils"

// Validate fields recursively
function validateFields(
	fields: Field[],
	data: any,
	parentPath = "",
): string | null {
	for (const field of fields) {
		const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
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
				const error = validateFields(field.fields, data, `${fieldPath}[${i}]`)
				if (error) return error
			}
		}
	}
	return null
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

	const handleFieldChange = (path: string, value: any) => {
		setContentData((prev) => setNestedValue(prev, path, value))
	}

	const handleAddRepeaterItem = (path: string) => {
		setContentData((prev) => {
			const currentValue = getNestedValue(prev, path) || []
			const newItem = {} // Empty object for new item
			return setNestedValue(prev, path, [...currentValue, newItem])
		})
	}

	const handleRemoveRepeaterItem = (path: string, index: number) => {
		setContentData((prev) => {
			const currentValue = getNestedValue(prev, path) || []
			const newValue = currentValue.filter((_: any, i: number) => i !== index)
			return setNestedValue(prev, path, newValue)
		})
	}

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
			// Scroll to top to show error message
			window.scrollTo({ top: 0, behavior: "smooth" })
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
				<h1 className="font-bold text-3xl">Create New Content</h1>
				<p className="mt-2 text-grey-500">Add a new content entry</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-red-50 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			<form id="content-form" onSubmit={handleSubmit} className="space-y-6">
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
							<h2 className="mb-4 font-semibold text-lg">Content Fields</h2>
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
								<h2 className="mb-4 font-semibold text-lg">SEO Metadata</h2>
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
							<h2 className="mb-4 font-semibold text-lg">Publication Status</h2>
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
										<div className="font-medium">Draft</div>
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
										<div className="font-medium">Published</div>
										<div className="text-grey-500 text-sm">
											Publish immediately (visible publicly)
										</div>
									</div>
								</label>
							</div>
						</div>
					</>
				)}
			</form>

			{/* Floating Action Buttons */}
			<div className="fixed right-8 bottom-8 z-10 flex gap-3">
				<Link
					href="/content"
					className="rounded-lg border border-grey-300 bg-white px-6 py-3 text-grey-500 shadow-lg transition-colors hover:bg-grey-100"
				>
					Cancel
				</Link>
				<button
					type="submit"
					form="content-form"
					disabled={loading || !selectedSchemaId}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white shadow-lg transition-colors hover:bg-primary-800 disabled:opacity-50"
				>
					<Save className="h-4 w-4" />
					{loading ? "Creating..." : "Create Content"}
				</button>
			</div>
		</div>
	)
}
