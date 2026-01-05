"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Globe, Image as ImageIcon, Save, X } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { authAtom } from "@/lib/auth-atom"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { FieldRenderer } from "../_components/field-renderer"
import { LocaleSelector } from "../_components/locale-selector"
import type { Field, LocalizationSettings } from "../_components/types"
import { getNestedValue, setNestedValue } from "../_components/utils"

// Dynamic import for MediaSelector to avoid SSR issues
const MediaSelector = dynamic(
	() =>
		import("../../media/_components/media-selector").then(
			(mod) => mod.MediaSelector,
		),
	{ ssr: false },
)

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
	const searchParams = useSearchParams()
	const preselectedSchema = searchParams.get("schema")

	// Build back URL with schema param for proper navigation
	const backUrl = preselectedSchema
		? `/content?schema=${preselectedSchema}`
		: "/content"

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const schemas = useQuery(api.cms.schemas.list, isReady ? {} : "skip")
	const allContent = useQuery(api.cms.content.listAll, isReady ? {} : "skip") // Load all content for references
	const localizationSettings = useQuery(
		api.cms.settings.get,
		isReady ? { key: "localization" } : "skip",
	) as LocalizationSettings | null | undefined
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
	const [seoOgImage, setSeoOgImage] = useState("")
	const [showMediaSelector, setShowMediaSelector] = useState(false)
	const lastAutoSlugRef = useRef<string | null>(null)
	const [isAutoSlugActive, setIsAutoSlugActive] = useState(true) // For new content, auto-slug is active by default

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

	// Auto-generate slug from slug field (only when auto-slug is active)
	useEffect(() => {
		if (!selectedSchema?.fields || !isAutoSlugActive) return

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

				const currentSlug = contentData[slugField.name]

				// Only auto-generate if slug matches the last auto-generated value
				// (user hasn't manually edited it)
				if (
					(!currentSlug || currentSlug === lastAutoSlugRef.current) &&
					currentSlug !== autoSlug
				) {
					setContentData((prev) => ({
						...prev,
						[slugField.name]: autoSlug,
					}))
					lastAutoSlugRef.current = autoSlug
				}
			}
		}
	}, [contentData, selectedSchema, isAutoSlugActive])

	// Helper to check if a field at a path is translatable
	const isFieldTranslatable = (fieldPath: string): boolean => {
		if (!hasLocales || !selectedSchema) return false

		const pathParts = fieldPath.split(".")
		let currentFields = selectedSchema.fields || []
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
			return rawValue
		}

		// For translatable fields, get the value for current locale
		if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
			return rawValue[currentLocale] ?? rawValue[defaultLocale] ?? ""
		}

		// Fallback: might be old content without locale structure
		return rawValue ?? ""
	}

	const handleFieldChange = (path: string, value: any) => {
		// Check if user is manually editing the slug field
		if (selectedSchema?.fields) {
			const slugField = selectedSchema.fields.find(
				(f: Field) => f.name === path && f.isSlug,
			)
			if (slugField && value !== lastAutoSlugRef.current) {
				// User manually edited the slug, deactivate auto-generation
				setIsAutoSlugActive(false)
			}
		}

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

	const handleRegenerateSlug = (slugFieldName: string) => {
		if (!selectedSchema?.fields) return

		const slugField = selectedSchema.fields.find(
			(f: Field) => f.name === slugFieldName && f.isSlug && f.slugSource,
		)

		if (slugField?.slugSource) {
			const sourceValue = contentData[slugField.slugSource]
			if (sourceValue && typeof sourceValue === "string") {
				const autoSlug = sourceValue
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, "")

				setContentData((prev) => ({
					...prev,
					[slugField.name]: autoSlug,
				}))
				lastAutoSlugRef.current = autoSlug
				// Activate auto-generation until user manually edits the slug
				setIsAutoSlugActive(true)
			}
		}
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

			const newContentId = await createContent({
				schemaId: selectedSchemaId as Id<"cmsSchemas">,
				status,
				data: contentData,
				seo:
					seoTitle || seoDescription || seoOgImage
						? {
								title: seoTitle || undefined,
								description: seoDescription || undefined,
								ogImage: seoOgImage || undefined,
							}
						: undefined,
			})

			// Redirect to the edit page of the newly created content
			// Use full page navigation to avoid stale state issues with Convex queries
			window.location.href = `/content/${newContentId}?schema=${selectedSchemaId}`
		} catch (err) {
			setError(getCleanErrorMessage(err, "Failed to create content"))
			// Scroll to top to show error message
			window.scrollTo({ top: 0, behavior: "smooth" })
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto">
			<div className="mb-6">
				<Link
					href={backUrl}
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

			<form
				id="content-form"
				onSubmit={handleSubmit}
				className="space-y-6 2xl:px-16"
			>
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

						<div className="rounded-lg bg-white p-6 shadow">
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
								{selectedSchema.fields.map((field: any) => {
									const isTranslatable = field.translatable && hasLocales
									const value = isTranslatable
										? getLocalizedValue(field.name)
										: getNestedValue(contentData, field.name)

									return (
										<div key={field.name} className="relative">
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
												onRegenerateSlug={handleRegenerateSlug}
												isAutoSlugActive={isAutoSlugActive}
											/>
										</div>
									)
								})}
							</div>
						</div>

						{/* SEO (only for pages and collections, not global) */}
						{selectedSchema.type !== "global" && (
							<div className="rounded-lg bg-white p-6 shadow">
								<h2 className="mb-4 font-semibold text-lg text-primary">
									SEO Metadata
								</h2>
								<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
									{/* Left Column - SEO Title & Description */}
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

									{/* Right Column - OG Image */}
									<div>
										<div className="mb-2 block font-medium text-grey-500 text-sm">
											OG Image
										</div>
										<p className="mb-2 text-grey-400 text-xs">
											Optional image for social media sharing
										</p>
										<div className="space-y-4">
											{seoOgImage ? (
												<div className="inline-flex w-full flex-col items-center">
													<div className="group relative max-w-md overflow-hidden rounded-lg border border-grey-300 bg-grey-50 transition-all hover:border-primary hover:shadow-md">
														<div className="relative overflow-hidden bg-grey-100">
															<CFImage
																assetId={seoOgImage}
																alt="OG Image"
																width={600}
																height={315}
																variant="public"
																className="h-auto max-h-64 w-auto transition-transform duration-300 group-hover:scale-105"
															/>
															<button
																type="button"
																onClick={() => setSeoOgImage("")}
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
												selectedCloudflareId={seoOgImage}
												onSelect={(media: {
													id: Id<"cmsMedia">
													cloudflareId: string
												}) => {
													setSeoOgImage(media.cloudflareId)
													setShowMediaSelector(false)
												}}
												onClose={() => setShowMediaSelector(false)}
											/>
										)}
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
			</form>

			{/* Floating Action Buttons */}
			<div className="fixed right-8 bottom-8 z-10 flex gap-3">
				<Link
					href={backUrl}
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
