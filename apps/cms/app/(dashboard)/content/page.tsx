"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage, getStringValue } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { Edit, Eye, FileText, Plus, Search, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { authAtom } from "@/lib/auth-atom"
import { ContentSidebar } from "./_components/content-sidebar"
import { ViewConfigModal } from "./_components/view-config-modal"

export default function ContentPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const preselectedSchema = searchParams.get("schema")

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const schemas = useQuery(api.cms.schemas.list, isReady ? {} : "skip")
	const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
		preselectedSchema || "",
	)
	const [showViewConfig, setShowViewConfig] = useState(false)

	// Update URL when schema changes
	const handleSelectSchema = (schemaId: string) => {
		setSelectedSchemaId(schemaId)
		router.push(`/content?schema=${schemaId}`, { scroll: false })
	}

	const content = useQuery(
		api.cms.content.listBySchema,
		isReady && selectedSchemaId
			? { schemaId: selectedSchemaId as Id<"cmsSchemas"> }
			: "skip",
	)

	const selectedSchema = schemas?.find((s) => s._id === selectedSchemaId)

	// Auto-select first schema if none selected
	useEffect(() => {
		if (schemas && schemas.length > 0 && !selectedSchemaId) {
			const firstSchemaId = schemas[0]._id
			setSelectedSchemaId(firstSchemaId)
			router.replace(`/content?schema=${firstSchemaId}`, { scroll: false })
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

	const previewFieldName = getPreviewField()
	const additionalFields = getAdditionalFields()
	const slugField = getSlugField()

	if (!schemas) {
		return (
			<div className="flex h-[calc(100vh-4rem)] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
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
							<h1 className="font-bold text-3xl text-primary">
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
										className="inline-flex items-center gap-2 rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-100"
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
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-grey-400" />
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search content..."
									className="w-full rounded-lg border border-grey-300 py-2 pr-4 pl-10 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
					{content === undefined && selectedSchemaId && (
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
							<h3 className="mb-2 font-semibold text-primary text-xl">
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
											<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
												{previewFieldName
													? selectedSchema?.fields.find(
															(f) => f.name === previewFieldName,
														)?.label || "Content"
													: "Content"}
											</th>
											{additionalFields.map((field: any) => (
												<th
													key={field.name}
													className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase"
												>
													{field.label}
												</th>
											))}
											<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
												Status
											</th>
											{slugField && (
												<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
													Slug
												</th>
											)}
											<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
												Updated
											</th>
											<th className="px-6 py-3 text-right font-semibold text-grey-500 text-xs uppercase">
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
															<div className="text-grey-500 text-sm">
																{getStringValue(item.seo.title)}
															</div>
														)}
													</td>
													{additionalFields.map((field: any) => (
														<td
															key={field.name}
															className="px-6 py-4 text-grey-700 text-sm"
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
															className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
																item.status === "published"
																	? "bg-green-light text-green"
																	: "bg-orange-light text-orange"
															}`}
														>
															{item.status}
														</span>
													</td>
													{slugField && (
														<td className="px-6 py-4 text-grey-500 text-sm">
															{getStringValue(item.data[slugField.name]) ? (
																<code className="rounded bg-grey-100 px-2 py-1 font-mono text-xs">
																	/{getStringValue(item.data[slugField.name])}
																</code>
															) : (
																"-"
															)}
														</td>
													)}
													<td className="px-6 py-4 text-grey-500 text-sm">
														{new Date(item.updatedAt).toLocaleDateString()}
													</td>
													<td className="px-6 py-4 text-right">
														<div className="flex items-center justify-end gap-2">
															{item.status === "published" &&
																slugField &&
																getStringValue(item.data[slugField.name]) && (
																	<button
																		type="button"
																		className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100"
																		title="Preview"
																	>
																		<Eye className="h-4 w-4" />
																	</button>
																)}
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
