"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { AlertTriangle, ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { FieldRenderer } from "../_components/field-renderer"
import type { Field } from "../_components/types"
import { getNestedValue, setNestedValue } from "../_components/utils"

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
	const { id: rawId } = use(params)
	const id = decodeURIComponent(rawId)
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
			setContentData(content.data || {})
			setSeoTitle(content.seo?.title || "")
			setSeoDescription(content.seo?.description || "")
		}
	}, [content])

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
			// Recursive validation
			const validationError = validateFields(schema?.fields || [], contentData)
			if (validationError) {
				throw new Error(validationError)
			}

			await updateContent({
				id: id as Id<"cmsContent">,
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
			// Scroll to top to show error message
			window.scrollTo({ top: 0, behavior: "smooth" })
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
				<h1 className="mb-4 font-bold text-2xl text-primary">
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
				<h1 className="font-bold text-3xl">Edit Content</h1>
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
							<h3 className="font-semibold text-lg">Delete Content</h3>
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

			<form id="content-form" onSubmit={handleSubmit} className="space-y-6">
				{/* Content Fields */}
				<div className="rounded-lg bg-white p-6 shadow-md">
					<h2 className="mb-4 font-semibold text-lg">Content Fields</h2>
					<div className="space-y-6">
						{schema.fields.map((field: any) => (
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

				{/* SEO */}
				{schema.type !== "global" && (
					<div className="rounded-lg bg-white p-6 shadow-md">
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
				<div className="rounded-lg bg-white p-6 shadow-md">
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
					disabled={loading}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white shadow-lg transition-colors hover:bg-primary-800 disabled:opacity-50"
				>
					<Save className="h-4 w-4" />
					{loading ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</div>
	)
}
