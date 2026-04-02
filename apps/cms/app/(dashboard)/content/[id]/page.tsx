"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage, getStringValue } from "@repo/cms-shared"
import { useMutation, useQuery } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ExternalLink,
	Eye,
	Globe,
	Image as ImageIcon,
	Save,
	Trash2,
	X,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useEffect, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { useSidebar } from "@/contexts/sidebar-context"
import { authAtom } from "@/lib/auth-atom"
import { getCleanErrorMessage } from "@/lib/error-utils"
import { sanitizeData } from "@/lib/sanitize-data"
import { FieldRenderer } from "../_components/field-renderer"
import { LivePreviewPanel } from "../_components/live-preview-panel"
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
	const searchParams = useSearchParams()
	const schemaFromUrl = searchParams.get("schema")

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	// Only query if we have an ID (let Convex handle invalid IDs)
	const content = useQuery(
		api.cms.content.get,
		isReady && id ? { id: id as Id<"cmsContent"> } : "skip",
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
		api.cms.settings.get,
		isReady ? { key: "localization" } : "skip",
	) as LocalizationSettings | null | undefined
	const previewSettings = useQuery(
		api.cms.settings.get,
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

	// Build the public page URL from the urlPattern and preview settings
	const getPublicPageUrl = (): string | null => {
		if (!schema?.previewConfig?.urlPattern) return null
		if (!previewSettings) return null
		const slug = getSlugFromContent()
		if (!slug) return null

		// Determine base URL: use production URL if available and we're not on localhost, otherwise use development URL
		const isLocalhost =
			typeof window !== "undefined" && window.location.hostname === "localhost"
		const baseUrl = isLocalhost
			? previewSettings.baseUrl
			: previewSettings.productionBaseUrl || previewSettings.baseUrl

		if (!baseUrl) return null

		// Replace {slug} placeholder with actual slug value
		const path = schema.previewConfig.urlPattern.replace("{slug}", slug)

		// Combine base URL with path, ensuring no double slashes
		const cleanBaseUrl = baseUrl.replace(/\/$/, "")
		const cleanPath = path.startsWith("/") ? path : `/${path}`

		return `${cleanBaseUrl}${cleanPath}`
	}

	const { setIsCollapsed } = useSidebar()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [showPreview, setShowPreview] = useState(false)
	const [showMediaSelector, setShowMediaSelector] = useState(false)

	// Collapse sidebar when preview is active
	useEffect(() => {
		setIsCollapsed(showPreview)
		// Restore sidebar when component unmounts
		return () => setIsCollapsed(false)
	}, [showPreview, setIsCollapsed])

	const [status, setStatus] = useState<"draft" | "published">("draft")
	const [contentData, setContentData] = useState<Record<string, any>>({})
	const [seoTitles, setSeoTitles] = useState<Record<string, string>>({})
	const [seoDescriptions, setSeoDescriptions] = useState<
		Record<string, string>
	>({})
	const [seoOgImage, setSeoOgImage] = useState("")
	const lastAutoSlugRef = useRef<string | null>(null)
	const [isAutoSlugActive, setIsAutoSlugActive] = useState(false)

	// Reset state when navigating to a different content item
	// biome-ignore lint/correctness/useExhaustiveDependencies: id is intentionally used as a trigger to reset state
	useEffect(() => {
		lastAutoSlugRef.current = null
		setIsAutoSlugActive(false)
	}, [id])

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
			const rawTitle = content.seo?.title
			if (rawTitle && typeof rawTitle === "object") {
				setSeoTitles(rawTitle as Record<string, string>)
			} else {
				setSeoTitles(
					rawTitle
						? { [hasLocales ? defaultLocale : "__"]: rawTitle as string }
						: {},
				)
			}
			const rawDescription = content.seo?.description
			if (rawDescription && typeof rawDescription === "object") {
				setSeoDescriptions(rawDescription as Record<string, string>)
			} else {
				setSeoDescriptions(
					rawDescription
						? { [hasLocales ? defaultLocale : "__"]: rawDescription as string }
						: {},
				)
			}
			setSeoOgImage(content.seo?.ogImage || "")
		}
	}, [content, hasLocales, defaultLocale])

	// Auto-generate slug from slug source field (only when auto-slug is active)
	useEffect(() => {
		if (!schema?.fields || !isAutoSlugActive) return

		const slugField = schema.fields.find(
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
					currentSlug === lastAutoSlugRef.current &&
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
	}, [contentData, schema, isAutoSlugActive])

	// Helper to check if a field at a path is translatable
	const isFieldTranslatable = (fieldPath: string): boolean => {
		return shouldFieldBeTranslatable(
			getFieldAtPath(schema?.fields, fieldPath),
			hasLocales,
		)
	}

	// Helper to get localized value
	const getLocalizedValue = (path: string) => {
		const rawValue = getNestedValue(contentData, path)
		const isTranslatable = isFieldTranslatable(path)

		if (!hasLocales && isLocaleMap(rawValue)) {
			return getStringValue(rawValue)
		}

		return getEditorLocalizedValue({
			rawValue,
			translatable: isTranslatable,
			hasLocales,
			currentLocale,
			defaultLocale,
		})
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
		// Check if user is manually editing the slug field
		if (schema?.fields) {
			const slugField = schema.fields.find(
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
		if (!schema?.fields) return

		const slugField = schema.fields.find(
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

			// Get slug for revalidation
			const slug = getSlugFromContent()

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

			await updateContent({
				id: id as Id<"cmsContent">,
				slug,
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

			// Stay on page and show success feedback
			setSaveSuccess(true)
			setTimeout(() => setSaveSuccess(false), 2000)
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
			<div className="flex min-h-100 items-center justify-center">
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
		<div className={showPreview ? "flex gap-8" : "mx-auto w-full px-8"}>
			{/* Editor Panel */}
			<div className={showPreview ? "w-[30%] min-w-0 shrink-0" : "w-full"}>
				<div className="mb-4 flex items-center justify-between">
					<Link
						href={backUrl}
						className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Content
					</Link>

					<div className="flex items-center gap-2">
						{/* View Page Button */}
						{getPublicPageUrl() && (
							<a
								href={getPublicPageUrl() ?? "#"}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								<ExternalLink className="h-4 w-4" />
								View Page
							</a>
						)}
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
					<h1 className="font-bold text-2xl text-primary">Edit Content</h1>
					<p className="mt-1 text-grey-500 text-sm">{schema.displayName}</p>
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

				<LocaleContext.Provider
					value={{ currentLocale, defaultLocale, hasLocales }}
				>
					<form
						id="content-form"
						onSubmit={handleSubmit}
						className="space-y-4 2xl:px-16"
					>
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
						<div className="rounded-sm border border-grey-200 bg-white p-4 shadow-md">
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
							<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
								{(() => {
									// Group consecutive small fields together
									const fieldGroups: any[][] = []
									let currentGroup: any[] = []

									const isSmallField = (fieldType: string) =>
										[
											"shortText",
											"select",
											"checkbox",
											"date",
											"number",
										].includes(fieldType)
									const isLargeField = (fieldType: string) =>
										[
											"richText",
											"flexibleBlocks",
											"repeater",
											"group",
											"blockReference",
										].includes(fieldType)

									schema.fields.forEach((field: any, index: number) => {
										if (isSmallField(field.type)) {
											currentGroup.push(field)
											// Check if next field is not small or is last field
											const nextField = schema.fields[index + 1]
											if (!nextField || !isSmallField(nextField.type)) {
												fieldGroups.push([...currentGroup])
												currentGroup = []
											}
										} else {
											// Medium or large field
											if (currentGroup.length > 0) {
												fieldGroups.push([...currentGroup])
												currentGroup = []
											}
											fieldGroups.push([field])
										}
									})

									return fieldGroups.map((group, groupIndex) => {
										const isGroupOfSmallFields = group.every((f) =>
											isSmallField(f.type),
										)
										const hasOnlyOneField = group.length === 1
										const singleField = group[0]
										const isLarge =
											hasOnlyOneField && isLargeField(singleField.type)

										if (isGroupOfSmallFields && group.length > 1) {
											// Group of small fields - render in a column
											return (
												<div key={groupIndex} className="space-y-4">
													{group.map((field: any) => {
														const isTranslatable = shouldFieldBeTranslatable(
															field,
															hasLocales,
														)
														const value = isTranslatable
															? getLocalizedValue(field.name)
															: getNestedValue(contentData, field.name)

														return (
															<div
																key={field.name}
																className="relative"
																data-field-path={field.name}
															>
																{isTranslatable && (
																	<div className="absolute top-0 right-0 z-10 rounded-tr-lg rounded-bl-lg bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
																		Translatable
																	</div>
																)}
																<FieldRenderer
																	field={field}
																	path={field.name}
																	value={value}
																	onChange={handleFieldChange}
																	onAddRepeaterItem={handleAddRepeaterItem}
																	onRemoveRepeaterItem={
																		handleRemoveRepeaterItem
																	}
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
											)
										}

										// Single field or large field
										const field = singleField
										const isTranslatable = shouldFieldBeTranslatable(
											field,
											hasLocales,
										)
										const value =
											isTranslatable || field.type === "map"
												? getLocalizedValue(field.name)
												: getNestedValue(contentData, field.name)

										return (
											<div
												key={field.name}
												className={`relative ${isLarge ? "lg:col-span-2" : ""}`}
												data-field-path={field.name}
											>
												{isTranslatable && (
													<div className="absolute top-0 right-0 z-10 rounded-tr-lg rounded-bl-lg bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
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
									})
								})()}
							</div>
						</div>

						{/* SEO */}
						{schema.type !== "global" && !schema.isSimple && (
							<div className="rounded-sm border border-grey-200 bg-white p-4 shadow-md">
								<h2 className="mb-4 font-semibold text-lg text-primary">
									SEO Metadata
								</h2>
								<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
												onChange={(e) =>
													setSeoTitles((prev) => ({
														...prev,
														[seoLocaleKey]: e.target.value,
													}))
												}
												placeholder="Page title for search engines"
												className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
											/>
										</div>
										<div>
											<label
												htmlFor="seo-description"
												className="mb-1 block font-medium text-grey-500 text-sm"
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
												className="w-full resize-none rounded-lg border border-grey-300 px-3 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
						<div className="rounded-sm border border-grey-200 bg-white p-4 shadow-md">
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
				</LocaleContext.Provider>

				{/* Floating Action Buttons */}
				<div
					className={`fixed bottom-6 z-10 flex gap-3 ${showPreview ? "left-24" : "right-8"}`}
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
							// Get slug for revalidation
							const slug = getSlugFromContent()
							await updateContent({
								id: id as Id<"cmsContent">,
								slug,
								status: "published",
								data: contentData,
								seo:
									Object.keys(seoTitles).length ||
									Object.keys(seoDescriptions).length ||
									seoOgImage
										? {
												title: hasLocales
													? Object.keys(seoTitles).length > 0
														? seoTitles
														: undefined
													: seoTitles.__ || undefined,
												description: hasLocales
													? Object.keys(seoDescriptions).length > 0
														? seoDescriptions
														: undefined
													: seoDescriptions.__ || undefined,
												ogImage: seoOgImage || undefined,
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
