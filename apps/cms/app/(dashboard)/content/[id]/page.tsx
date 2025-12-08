"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { getStringValue } from "@repo/cms-shared"
import { useAtom } from "@lfades/atom"
import { useMutation, useQuery } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Eye,
	Globe,
	Save,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useEffect, useState } from "react"
import { useSidebar } from "@/contexts/sidebar-context"
import { authAtom } from "@/lib/auth-atom"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { FieldRenderer } from "../_components/field-renderer"
import { LivePreviewPanel } from "../_components/live-preview-panel"
import { LocaleSelector } from "../_components/locale-selector"
import type { Field, LocalizationSettings } from "../_components/types"
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
	const searchParams = useSearchParams()
	const schemaFromUrl = searchParams.get("schema")

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const content = useQuery(
		api.cms.content.get,
		isReady ? { id: id as Id<"cmsContent"> } : "skip",
	)

	// Build back URL with schema param for proper navigation
	const backUrl = schemaFromUrl
		? `/content?schema=${schemaFromUrl}`
		: content?.schemaId
			? `/content?schema=${content.schemaId}`
			: "/content"
	const schema = useQuery(
		api.cms.schemas.get,
		isReady && content ? { id: content.schemaId } : "skip",
	)
	const schemas = useQuery(api.cms.schemas.list, isReady ? {} : "skip")
	const allContent = useQuery(api.cms.content.listAll, isReady ? {} : "skip")
	const localizationSettings = useQuery(
		api.settings.get,
		isReady ? { key: "localization" } : "skip",
	) as LocalizationSettings | null | undefined
	const previewSettings = useQuery(
		api.settings.get,
		isReady ? { key: "preview" } : "skip",
	) as {
		enabled: boolean
		baseUrl: string
		productionBaseUrl: string
	} | null
	const updateContent = useMutation(api.cms.content.update)
	const deleteContent = useMutation(api.cms.content.remove)

	// Check if preview is available for this schema
	const isPreviewAvailable =
		previewSettings?.enabled &&
		schema?.previewConfig?.enabled &&
		schema?.previewConfig?.urlPattern

	// Get slug from content data
	const getSlugFromContent = (): string | undefined => {
		if (!schema) return undefined
		const slugField = schema.fields.find((f: any) => f.isSlug)
		if (slugField) {
			return getStringValue(contentData[slugField.name]) || undefined
		}
		return contentData.slug || undefined
	}

	const { setIsCollapsed } = useSidebar()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showPreview, setShowPreview] = useState(false)

	// Collapse sidebar when preview is active
	useEffect(() => {
		setIsCollapsed(showPreview)
		// Restore sidebar when component unmounts
		return () => setIsCollapsed(false)
	}, [showPreview, setIsCollapsed])

	const [status, setStatus] = useState<"draft" | "published">("draft")
	const [contentData, setContentData] = useState<Record<string, any>>({})
	const [seoTitle, setSeoTitle] = useState("")
	const [seoDescription, setSeoDescription] = useState("")

	// i18n state
	const hasLocales = (localizationSettings?.locales?.length ?? 0) > 0
	const locales = localizationSettings?.locales ?? []
	const defaultLocale = localizationSettings?.defaultLocale ?? ""
	const [currentLocale, setCurrentLocale] = useState<string>("")

	// Set default locale when settings load
	useEffect(() => {
		if (defaultLocale && !currentLocale) {
			setCurrentLocale(defaultLocale)
		}
	}, [defaultLocale, currentLocale])

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

	// Helper to check if a field at a path is translatable
	const isFieldTranslatable = (fieldPath: string): boolean => {
		if (!hasLocales) return false

		const pathParts = fieldPath.split(".")
		let currentFields = schema?.fields || []
		let isTranslatable = false

		for (const part of pathParts) {
			// Skip array indices like [0]
			const cleanPart = part.replace(/\[\d+\]/g, "")
			if (!cleanPart) continue

			const field = currentFields.find((f: Field) => f.name === cleanPart)
			if (field) {
				isTranslatable = field.translatable ?? false
				// Navigate into nested fields
				if (field.fields) {
					currentFields = field.fields
				}
			}
		}

		return isTranslatable
	}

	// Helper to get localized value
	const getLocalizedValue = (path: string) => {
		const rawValue = getNestedValue(contentData, path)

		if (!hasLocales || !isFieldTranslatable(path)) {
			// If locales are disabled but value is a localized object, extract string value
			if (
				rawValue &&
				typeof rawValue === "object" &&
				!Array.isArray(rawValue)
			) {
				// Check if this looks like a localized object (keys are locale codes)
				const keys = Object.keys(rawValue)
				const looksLikeLocalized =
					keys.length > 0 && keys.every((k) => k.length >= 2 && k.length <= 5)
				if (looksLikeLocalized) {
					return getStringValue(rawValue)
				}
			}
			return rawValue
		}

		// For translatable fields, get the value for current locale
		if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
			return rawValue[currentLocale] ?? rawValue[defaultLocale] ?? ""
		}

		// Fallback: might be old content without locale structure
		return rawValue ?? ""
	}

	// Helper to set localized value
	const _setLocalizedValue = (path: string, value: any): any => {
		if (!hasLocales || !isFieldTranslatable(path)) {
			return setNestedValue(contentData, path, value)
		}

		// For translatable fields, set value for current locale
		const currentValue = getNestedValue(contentData, path)
		const localizedValue =
			currentValue && typeof currentValue === "object"
				? { ...currentValue, [currentLocale]: value }
				: { [currentLocale]: value }

		return setNestedValue(contentData, path, localizedValue)
	}

	const handleFieldChange = (path: string, value: any) => {
		setContentData((prev) => {
			if (!hasLocales || !isFieldTranslatable(path)) {
				return setNestedValue(prev, path, value)
			}

			// For translatable fields, set value for current locale
			const currentValue = getNestedValue(prev, path)
			const localizedValue =
				currentValue &&
				typeof currentValue === "object" &&
				!Array.isArray(currentValue)
					? { ...currentValue, [currentLocale]: value }
					: { [currentLocale]: value }

			return setNestedValue(prev, path, localizedValue)
		})
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

	const [saveSuccess, setSaveSuccess] = useState(false)

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

			// If in preview mode, stay on page and show success feedback
			if (showPreview) {
				setSaveSuccess(true)
				setTimeout(() => setSaveSuccess(false), 2000)
			} else {
				// Otherwise redirect to content list
				router.push("/content")
			}
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
				<Link href={backUrl} className="text-primary hover:underline">
					← Back to Content
				</Link>
			</div>
		)
	}

	return (
		<div className={showPreview ? "flex gap-8" : "mx-auto max-w-4xl"}>
			{/* Editor Panel */}
			<div className={showPreview ? "w-[30%] min-w-0 shrink-0" : "w-full"}>
				<div className="mb-6 flex items-center justify-between">
					<Link
						href={backUrl}
						className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Content
					</Link>

					<div className="flex items-center gap-2">
						{/* Preview Toggle */}
						{isPreviewAvailable && (
							<button
								type="button"
								onClick={() => setShowPreview(!showPreview)}
								className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
									showPreview
										? "bg-primary text-white"
										: "border border-grey-300 text-grey-700 hover:bg-grey-50"
								}`}
							>
								<Eye className="h-4 w-4" />
								{showPreview ? "Hide Preview" : "Live Preview"}
							</button>
						)}
						<button
							type="button"
							onClick={() => setShowDeleteConfirm(true)}
							className="inline-flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-error transition-colors hover:bg-error hover:text-white"
						>
							<Trash2 className="h-4 w-4" />
							Delete
						</button>
					</div>
				</div>

				<div className="mb-6">
					<h1 className="font-bold text-3xl text-primary">Edit Content</h1>
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
								<h3 className="font-semibold text-lg text-primary">
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

				<form id="content-form" onSubmit={handleSubmit} className="space-y-6">
					{/* Locale Selector */}
					{hasLocales && locales.length > 0 && (
						<div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
							<div className="flex items-center gap-2 text-blue-800">
								<Globe className="h-5 w-5" />
								<span className="font-medium">Editing language:</span>
							</div>
							<LocaleSelector
								locales={locales}
								currentLocale={currentLocale}
								onChange={setCurrentLocale}
								defaultLocale={defaultLocale}
							/>
						</div>
					)}

					{/* Content Fields */}
					<div className="rounded-lg bg-white p-6 shadow-md">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-semibold text-lg text-primary">
								Content Fields
							</h2>
							{hasLocales && currentLocale && (
								<span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-blue-700 text-xs uppercase">
									{currentLocale}
								</span>
							)}
						</div>
						<div className="space-y-6">
							{schema.fields.map((field: any) => {
								const isTranslatable = field.translatable && hasLocales
								// Always use getLocalizedValue to handle legacy localized content when locales are disabled
								const value = field.translatable
									? getLocalizedValue(field.name)
									: getNestedValue(contentData, field.name)

								return (
									<div
										key={field.name}
										className="relative"
										data-field-path={field.name}
									>
										{isTranslatable && (
											<div className="absolute top-0 right-0 rounded-tr-lg rounded-bl-lg bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
												Translatable
											</div>
										)}
										<FieldRenderer
											field={field}
											path={field.name}
											value={value}
											onChange={handleFieldChange}
											onAddRepeaterItem={handleAddRepeaterItem}
											onRemoveRepeaterItem={handleRemoveRepeaterItem}
											allSchemas={schemas || []}
											contentBySchema={contentBySchema}
										/>
									</div>
								)
							})}
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
				<div
					className={`fixed bottom-6 z-10 flex gap-3 ${showPreview ? "left-[96px]" : "right-8"}`}
				>
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
						className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-lg transition-colors disabled:opacity-50 ${
							saveSuccess
								? "bg-green hover:bg-green"
								: "bg-primary hover:bg-primary-800"
						}`}
					>
						{saveSuccess ? (
							<>
								<Check className="h-4 w-4" />
								Saved!
							</>
						) : (
							<>
								<Save className="h-4 w-4" />
								{loading ? "Saving..." : "Save Changes"}
							</>
						)}
					</button>
				</div>
			</div>

			{/* Preview Panel */}
			{showPreview && isPreviewAvailable && (
				<div className="min-w-0 flex-1">
					<LivePreviewPanel
						contentId={id}
						schemaId={content.schemaId}
						contentData={contentData}
						contentStatus={status}
						slug={getSlugFromContent()}
						urlPattern={schema.previewConfig?.urlPattern}
						enabled={schema.previewConfig?.enabled}
						justSaved={saveSuccess}
						onPublish={async () => {
							// Set status to published and save
							setStatus("published")
							await updateContent({
								id: id as Id<"cmsContent">,
								status: "published",
								data: contentData,
								seo:
									seoTitle || seoDescription
										? {
												title: seoTitle || undefined,
												description: seoDescription || undefined,
											}
										: undefined,
							})
						}}
					/>
				</div>
			)}
		</div>
	)
}
