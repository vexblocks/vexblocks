"use client"

import { useMutation, useQuery } from "convex/react"
import { Copy, Edit, Eye, FileText, Plus, Search, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useCachedQuery } from "@/lib/use-cached-query"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage, getStringValue } from "@repo/cms-shared"
import { ContentSidebar } from "./_components/content-sidebar"
import { ViewConfigModal } from "./_components/view-config-modal"

export default function ContentPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const preselectedSchema = searchParams.get("schema")

	// Use cached query - shows cached data instantly on navigation
	const { data: schemas, isPending: schemasLoading } = useCachedQuery(
		api.cms.schemas.list,
		{},
	)

	const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
		preselectedSchema || "",
	)
	const [showViewConfig, setShowViewConfig] = useState(false)
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
	const duplicateContent = useMutation(api.cms.content.duplicate)
	const previewSettings = useQuery(api.cms.settings.get, { key: "preview" }) as
		| { enabled: boolean; baseUrl: string; productionBaseUrl: string }
		| null
		| undefined

	// Update URL when schema changes
	const handleSelectSchema = (schemaId: string) => {
		setSelectedSchemaId(schemaId)
		router.push(`/content?schema=${schemaId}`, { scroll: false })
	}

	const { data: content, isPending: contentLoading } = useCachedQuery(
		api.cms.content.listBySchema,
		selectedSchemaId
			? { schemaId: selectedSchemaId as Id<"cmsSchemas"> }
			: "skip",
	)

	const selectedSchema = schemas?.find((s) => s._id === selectedSchemaId)

	// Auto-select first collection schema (or first schema as fallback) if none selected
	useEffect(() => {
		if (schemas && schemas.length > 0 && !selectedSchemaId) {
			const firstSchema =
				schemas.find((s) => s.type === "collection") || schemas[0]
			setSelectedSchemaId(firstSchema._id)
			router.replace(`/content?schema=${firstSchema._id}`, { scroll: false })
		}
	}, [schemas, selectedSchemaId, router])

	const [searchQuery, setSearchQuery] = useState("")
	const [statusFilter, setStatusFilter] = useState<
		"all" | "draft" | "published"
	>("all")

	const filteredContent = content?.filter((item) => {
		const matchesSearch = searchQuery
			? JSON.stringify(item.data)
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
			: true
		const matchesStatus =
			statusFilter === "all" ? true : item.status === statusFilter
		return matchesSearch && matchesStatus
	})

	// Helper to get field value
	const getFieldValue = (item: any, fieldName: string) => {
		return item.data[fieldName]
	}

	// Get preview field (from viewConfig or fallback to first text field)
	const getPreviewField = () => {
		if (selectedSchema?.viewConfig?.previewField) {
			return selectedSchema.viewConfig.previewField
		}
		const firstTextField = selectedSchema?.fields.find(
			(f) => f.type === "shortText" || f.type === "longText",
		)
		return firstTextField?.name
	}

	// Get additional fields to display
	const getAdditionalFields = () => {
		if (selectedSchema?.viewConfig?.additionalFields) {
			return selectedSchema.viewConfig.additionalFields
				.map((fieldName) =>
					selectedSchema.fields.find((f) => f.name === fieldName),
				)
				.filter(Boolean)
		}
		return []
	}

	// Find slug field
	const getSlugField = () => {
		return selectedSchema?.fields.find((f) => f.isSlug)
	}

	// Handle duplicate content
	const handleDuplicate = async (id: Id<"cmsContent">) => {
		try {
			setDuplicatingId(id)
			const newContentId = await duplicateContent({ id })
			// Use full page navigation to avoid stale state issues with Convex queries
			// Client-side navigation can cause race conditions where old query state
			// interferes with the new content ID
			window.location.href = `/content/${newContentId}?schema=${selectedSchemaId}`
		} catch (error) {
			console.error("Failed to duplicate content:", error)
			setDuplicatingId(null)
		}
	}

	const getPublicPageUrl = (item: any): string | null => {
		if (!selectedSchema?.previewConfig?.urlPattern) return null
		if (!previewSettings) return null
		const slugField = getSlugField()
		const slug = slugField
			? getStringValue(item.data[slugField.name])
			: item.data.slug
		if (!slug) return null

		const isLocalhost =
			typeof window !== "undefined" && window.location.hostname === "localhost"
		const baseUrl = isLocalhost
			? previewSettings.baseUrl
			: previewSettings.productionBaseUrl || previewSettings.baseUrl
		if (!baseUrl) return null

		const path = selectedSchema.previewConfig.urlPattern.replace("{slug}", slug)
		const cleanBaseUrl = baseUrl.replace(/\/$/, "")
		const cleanPath = path.startsWith("/") ? path : `/${path}`

		// If the path resolves to /home, open the root instead
		if (cleanPath === "/home") return cleanBaseUrl || "/"

		return `${cleanBaseUrl}${cleanPath}`
	}

	const previewFieldName = getPreviewField()
	const additionalFields = getAdditionalFields()
	const slugField = getSlugField()

	// Show loading only on initial load
	if (schemasLoading && !schemas) {
		return (
			<div className="flex h-[calc(100vh-4rem)] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
	}

	if (!schemas) {
		return null
	}

	return (
		<div className="flex h-[calc(100vh-4rem)]">
			{/* Sidebar */}
			<ContentSidebar
				schemas={schemas}
				selectedSchemaId={selectedSchemaId}
				onSelectSchema={handleSelectSchema}
			/>

			{/* Main Content Area */}
			<div className="flex-1 overflow-auto">
				<div className="p-6">
					{/* Header */}
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-primary">
								{selectedSchema?.displayName || "Content"}
							</h1>
							<p className="mt-2 text-grey-500">
								Manage your {selectedSchema?.displayName.toLowerCase()} entries
							</p>
						</div>
						<div className="flex gap-2">
							{selectedSchemaId && (
								<>
									<button
										type="button"
										onClick={() => setShowViewConfig(true)}
										className="text-grey-700 inline-flex items-center gap-2 rounded-lg border border-grey-300 px-4 py-2 transition-colors hover:bg-grey-100"
									>
										<Settings className="h-5 w-5" />
										Configure View
									</button>
									<Link
										href={`/content/new?schema=${selectedSchemaId}`}
										className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
									>
										<Plus className="h-5 w-5" />
										Create Content
									</Link>
								</>
							)}
						</div>
					</div>

					{/* Filters and Search */}
					{selectedSchemaId && (
						<div className="mb-6 flex flex-wrap items-center gap-4">
							<div className="relative flex-1">
								<Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-grey-400" />
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search content..."
									className="w-full rounded-lg border border-grey-300 py-2 pr-4 pl-10 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
								/>
							</div>

							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setStatusFilter("all")}
									className={`rounded-lg px-4 py-2 text-sm transition-colors ${
										statusFilter === "all"
											? "bg-primary text-white"
											: "bg-grey-100 text-grey-500 hover:bg-grey-200"
									}`}
								>
									All
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("draft")}
									className={`rounded-lg px-4 py-2 text-sm transition-colors ${
										statusFilter === "draft"
											? "bg-orange text-white"
											: "bg-grey-100 text-grey-500 hover:bg-grey-200"
									}`}
								>
									Draft
								</button>
								<button
									type="button"
									onClick={() => setStatusFilter("published")}
									className={`rounded-lg px-4 py-2 text-sm transition-colors ${
										statusFilter === "published"
											? "bg-green text-white"
											: "bg-grey-100 text-grey-500 hover:bg-grey-200"
									}`}
								>
									Published
								</button>
							</div>
						</div>
					)}

					{/* Loading State */}
					{contentLoading && !content && selectedSchemaId && (
						<div className="rounded-lg bg-white p-12 text-center shadow">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="mt-4 text-grey-500">Loading content...</p>
						</div>
					)}

					{/* Empty State - No Content */}
					{selectedSchemaId && content && content.length === 0 && (
						<div className="rounded-lg bg-white p-12 text-center shadow">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-100">
								<FileText className="h-8 w-8 text-grey-400" />
							</div>
							<h3 className="mb-2 text-xl font-semibold text-primary">
								No content yet
							</h3>
							<p className="mb-6 text-grey-500">
								Create your first content entry for{" "}
								{selectedSchema?.displayName}
							</p>
							<Link
								href={`/content/new?schema=${selectedSchemaId}`}
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800"
							>
								<Plus className="h-5 w-5" />
								Create Content
							</Link>
						</div>
					)}

					{/* Content Table */}
					{filteredContent && filteredContent.length > 0 && (
						<div className="overflow-hidden rounded-lg bg-white shadow">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-grey-100">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
												{previewFieldName
													? selectedSchema?.fields.find(
															(f) => f.name === previewFieldName,
														)?.label || "Content"
													: "Content"}
											</th>
											{additionalFields.map((field: any) => (
												<th
													key={field.name}
													className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase"
												>
													{field.label}
												</th>
											))}
											<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
												Status
											</th>
											{slugField && (
												<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
													Slug
												</th>
											)}
											<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
												Updated
											</th>
											<th className="px-6 py-3 text-right text-xs font-semibold text-grey-500 uppercase">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-grey-200">
										{filteredContent.map((item) => {
											const previewText = previewFieldName
												? getFieldValue(item, previewFieldName)
												: "No preview"

											return (
												<tr key={item._id} className="hover:bg-grey-50">
													<td className="px-6 py-4">
														<div className="font-medium text-primary">
															{getStringValue(previewText) || "Untitled"}
														</div>
														{item.seo?.title && (
															<div className="text-sm text-grey-500">
																{getStringValue(item.seo.title)}
															</div>
														)}
													</td>
													{additionalFields.map((field: any) => (
														<td
															key={field.name}
															className="text-grey-700 px-6 py-4 text-sm"
														>
															{(() => {
																const value = getFieldValue(item, field.name)
																// Format based on field type
																if (field.type === "boolean") {
																	return value ? "Yes" : "No"
																}
																if (field.type === "date") {
																	const dateValue = getStringValue(value)
																	return dateValue
																		? new Date(dateValue).toLocaleDateString()
																		: "-"
																}
																if (field.type === "media") {
																	const mediaValue = getStringValue(value)
																	return mediaValue ? (
																		<CFImage
																			assetId={mediaValue}
																			alt={field.label}
																			width={80}
																			height={80}
																			variant="public"
																			className="h-12 w-12 rounded-lg object-cover"
																		/>
																	) : (
																		"-"
																	)
																}
																return getStringValue(value) || "-"
															})()}
														</td>
													))}
													<td className="px-6 py-4">
														<span
															className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
																item.status === "published"
																	? "bg-green-light text-green"
																	: "bg-orange-light text-orange"
															}`}
														>
															{item.status}
														</span>
													</td>
													{slugField && (
														<td className="px-6 py-4 text-sm text-grey-500">
															{getStringValue(item.data[slugField.name]) ? (
																<code className="rounded bg-grey-100 px-2 py-1 font-mono text-xs">
																	/{getStringValue(item.data[slugField.name])}
																</code>
															) : (
																"-"
															)}
														</td>
													)}
													<td className="px-6 py-4 text-sm text-grey-500">
														{new Date(item.updatedAt).toLocaleDateString()}
													</td>
													<td className="px-6 py-4 text-right">
														<div className="flex items-center justify-end gap-2">
															{(() => {
																const url = getPublicPageUrl(item)
																return url ? (
																	<a
																		href={url}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100"
																		title="View Page"
																	>
																		<Eye className="h-4 w-4" />
																	</a>
																) : null
															})()}
															<button
																type="button"
																onClick={() => handleDuplicate(item._id)}
																disabled={duplicatingId === item._id}
																className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-50"
																title="Duplicate (as draft)"
															>
																{duplicatingId === item._id ? (
																	<div className="h-4 w-4 animate-spin rounded-full border-2 border-grey-400 border-t-transparent" />
																) : (
																	<Copy className="h-4 w-4" />
																)}
															</button>
															<Link
																href={`/content/${item._id}?schema=${selectedSchemaId}`}
																className="rounded p-2 text-primary transition-colors hover:bg-primary/10"
																title="Edit"
															>
																<Edit className="h-4 w-4" />
															</Link>
														</div>
													</td>
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* No Results */}
					{filteredContent &&
						filteredContent.length === 0 &&
						content &&
						content.length > 0 && (
							<div className="rounded-lg bg-white p-12 text-center shadow">
								<p className="text-grey-500">
									No content matches your search or filters
								</p>
							</div>
						)}
				</div>
			</div>

			{/* View Config Modal */}
			{showViewConfig && selectedSchema && (
				<ViewConfigModal
					schema={selectedSchema}
					onClose={() => setShowViewConfig(false)}
				/>
			)}
		</div>
	)
}
