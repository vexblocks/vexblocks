"use client"

import { useAtom } from "@lfades/atom"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Globe, Image as ImageIcon, Save, X } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { authAtom } from "@/lib/auth-atom"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { sanitizeData } from "@/lib/sanitize-data"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { FieldRenderer } from "../_components/field-renderer"
import { LocaleContext } from "../_components/locale-context"
import { LocaleSelector } from "../_components/locale-selector"
import type { Field, LocalizationSettings } from "../_components/types"
import {
	getEditorLocalizedValue,
	getFieldAtPath,
	getNestedValue,
	isLocaleMap,
	mergeLocalizedValue,
	setNestedValue,
	shouldFieldBeTranslatable,
} from "../_components/utils"

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
	const [seoTitles, setSeoTitles] = useState<Record<string, string>>({})
	const [seoDescriptions, setSeoDescriptions] = useState<
		Record<string, string>
	>({})
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

	// Computed SEO values for current locale
	const seoLocaleKey = hasLocales ? currentLocale || defaultLocale : "__"
	const seoTitle = seoTitles[seoLocaleKey] ?? ""
	const seoDescription = seoDescriptions[seoLocaleKey] ?? ""

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
			const sourceRaw = contentData[slugField.slugSource]
			const sourceValue =
				typeof sourceRaw === "string"
					? sourceRaw
					: sourceRaw && typeof sourceRaw === "object"
						? (sourceRaw[defaultLocale] ??
							sourceRaw[currentLocale] ??
							Object.values(sourceRaw)[0])
						: null

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
	}, [
		contentData,
		selectedSchema,
		isAutoSlugActive,
		defaultLocale,
		currentLocale,
	])

	// Helper to check if a field at a path is translatable
	const isFieldTranslatable = (fieldPath: string): boolean => {
		return shouldFieldBeTranslatable(
			getFieldAtPath(selectedSchema?.fields, fieldPath),
			hasLocales,
		)
	}

	// Helper to get localized value
	const getLocalizedValue = (path: string) => {
		const rawValue = getNestedValue(contentData, path)
		const isTranslatable = isFieldTranslatable(path)

		if (!hasLocales && isLocaleMap(rawValue)) {
			return rawValue
		}

		return getEditorLocalizedValue({
			rawValue,
			translatable: isTranslatable,
			hasLocales,
			currentLocale,
			defaultLocale,
		})
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
			const isTranslatableSchema = hasLocales && isFieldTranslatable(path)
			const currentValue = getNestedValue(prev, path)

			// Detect if the value is already structured as locales (handles migration of previously-localized fields)
			const isAlreadyLocalized = isLocaleMap(currentValue, {
				excludeKeys: ["url", "newWindow"],
				requireAllKeys: false,
			})

			const isTranslatable = isTranslatableSchema || isAlreadyLocalized

			if (!isTranslatable) {
				return setNestedValue(prev, path, value)
			}

			return setNestedValue(
				prev,
				path,
				mergeLocalizedValue({
					currentValue,
					nextValue: value,
					currentLocale,
					defaultLocale,
				}),
			)
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

	const handleMoveRepeaterItem = (
		path: string,
		index: number,
		direction: "up" | "down",
	) => {
		setContentData((prev) => {
			const currentValue = getNestedValue(prev, path) || []
			const newIndex = direction === "up" ? index - 1 : index + 1
			if (newIndex < 0 || newIndex >= currentValue.length) return prev
			const newValue = [...currentValue]
			;[newValue[index], newValue[newIndex]] = [
				newValue[newIndex],
				newValue[index],
			]
			return setNestedValue(prev, path, newValue)
		})
	}

	const handleRegenerateSlug = (slugFieldName: string) => {
		if (!selectedSchema?.fields) return

		const slugField = selectedSchema.fields.find(
			(f: Field) => f.name === slugFieldName && f.isSlug && f.slugSource,
		)

		if (slugField?.slugSource) {
			const sourceRaw = contentData[slugField.slugSource]
			const sourceValue =
				typeof sourceRaw === "string"
					? sourceRaw
					: sourceRaw && typeof sourceRaw === "object"
						? (sourceRaw[defaultLocale] ??
							sourceRaw[currentLocale] ??
							Object.values(sourceRaw)[0])
						: null

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

			// Sanitize all data to remove unusual line terminators
			const sanitizedData = sanitizeData(contentData)
			const seoTitleToSave = hasLocales
				? Object.keys(seoTitles).length > 0
					? sanitizeData(seoTitles)
					: undefined
				: sanitizeData(seoTitles.__) || undefined
			const seoDescriptionToSave = hasLocales
				? Object.keys(seoDescriptions).length > 0
					? sanitizeData(seoDescriptions)
					: undefined
				: sanitizeData(seoDescriptions.__) || undefined

			const newContentId = await createContent({
				schemaId: selectedSchemaId as Id<"cmsSchemas">,
				status,
				data: sanitizedData,
				seo:
					seoTitleToSave || seoDescriptionToSave || seoOgImage
						? {
								title: seoTitleToSave,
								description: seoDescriptionToSave,
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
			<div className="mb-4">
				<Link
					href={backUrl}
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Content
				</Link>
			</div>

			<div className="mb-4">
				<h1 className="text-2xl font-bold text-primary">Create New Content</h1>
				<p className="mt-1 text-sm text-grey-500">Add a new content entry</p>
			</div>

			{error && (
				<div className="mb-4 rounded-lg bg-red-50 p-4">
					<p className="text-sm text-error">{error}</p>
				</div>
			)}

			<LocaleContext.Provider
				value={{ currentLocale, defaultLocale, hasLocales }}
			>
				<form
					id="content-form"
					onSubmit={handleSubmit}
					className="space-y-4 2xl:px-16"
				>
					{/* Schema Selection */}
					<div className="rounded-lg bg-white p-4 shadow">
						<label
							htmlFor="schema-select"
							className="mb-2 block text-sm font-medium text-grey-500"
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
							className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
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

							<div className="rounded-lg bg-white p-4 shadow">
								<div className="mb-4 flex items-center justify-between">
									<h2 className="text-lg font-semibold text-primary">
										Content Fields
									</h2>
									{hasLocales && currentLocale && (
										<span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-xs text-blue-700 uppercase">
											{currentLocale}
										</span>
									)}
								</div>
								<div className="space-y-4">
									{selectedSchema.fields.map((field: any) => {
										const isTranslatable = shouldFieldBeTranslatable(
											field,
											hasLocales,
										)
										const value = isTranslatable
											? getLocalizedValue(field.name)
											: getNestedValue(contentData, field.name)

										return (
											<div key={field.name} className="relative">
												{isTranslatable && (
													<div className="absolute top-0 right-0 rounded-tr-lg rounded-bl-lg bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
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
													onMoveRepeaterItem={handleMoveRepeaterItem}
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

							{/* SEO (only for pages and collections, not global or simple) */}
							{selectedSchema.type !== "global" && !selectedSchema.isSimple && (
								<div className="rounded-lg bg-white p-4 shadow">
									<h2 className="mb-4 text-lg font-semibold text-primary">
										SEO Metadata
									</h2>
									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										{/* Left Column - SEO Title & Description */}
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
													onChange={(e) =>
														setSeoTitles((prev) => ({
															...prev,
															[seoLocaleKey]: e.target.value,
														}))
													}
													placeholder="Page title for search engines"
													className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
												/>
											</div>
											<div>
												<label
													htmlFor="seo-description"
													className="mb-2 block text-sm font-medium text-grey-500"
												>
													SEO Description
												</label>
												<TextareaAutosize
													id="seo-description"
													value={seoDescription}
													onChange={(e) =>
														setSeoDescriptions((prev) => ({
															...prev,
															[seoLocaleKey]: e.target.value,
														}))
													}
													placeholder="Page description for search engines"
													minRows={2}
													maxRows={6}
													className="w-full resize-none rounded-lg border border-grey-300 px-3 py-2 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
												/>
											</div>
										</div>

										{/* Right Column - OG Image */}
										<div>
											<div className="mb-2 block text-sm font-medium text-grey-500">
												OG Image
											</div>
											<p className="mb-2 text-xs text-grey-400">
												Optional image for social media sharing
											</p>
											<div className="space-y-4">
												{seoOgImage ? (
													<div className="inline-flex w-full flex-col items-center">
														<div className="group bg-grey-50 relative max-w-md overflow-hidden rounded-lg border border-grey-300 transition-all hover:border-primary hover:shadow-md">
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
															<div className="border-t border-grey-200 bg-white p-3">
																<button
																	type="button"
																	onClick={() => setShowMediaSelector(true)}
																	className="text-grey-700 w-full rounded-lg bg-grey-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-grey-200"
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
														className="group bg-grey-50 flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-grey-300 p-4 transition-all hover:border-primary hover:bg-primary/5"
													>
														<div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-100 transition-colors group-hover:bg-primary/10">
															<ImageIcon className="h-8 w-8 text-grey-400 transition-colors group-hover:text-primary" />
														</div>
														<div className="text-center">
															<p className="text-grey-700 text-sm font-medium transition-colors group-hover:text-primary">
																Select from Media Library
															</p>
															<p className="mt-1 text-xs text-grey-500">
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
							<div className="rounded-lg bg-white p-4 shadow">
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
						</>
					)}
				</form>
			</LocaleContext.Provider>

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
