"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import Link from "next/link"
import { Plus, FileText, Eye, Edit, Trash2, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ContentPage() {
	const searchParams = useSearchParams()
	const preselectedSchema = searchParams.get("schema")

	const schemas = useQuery(api.cms.schemas.list)
	const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
		preselectedSchema || "",
	)

	const content = useQuery(
		api.cms.content.listBySchema,
		selectedSchemaId
			? { schemaId: selectedSchemaId as Id<"cmsSchemas"> }
			: "skip",
	)

	const selectedSchema = schemas?.find((s) => s._id === selectedSchemaId)

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

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-primary">Content</h1>
					<p className="mt-2 text-grey-500">Manage your content entries</p>
				</div>
				{selectedSchemaId && (
					<Link
						href={`/content/new?schema=${selectedSchemaId}`}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
					>
						<Plus className="h-5 w-5" />
						Create Content
					</Link>
				)}
			</div>

			{/* Schema Selector */}
			<div className="mb-6 rounded-lg bg-white p-6 shadow">
				<label className="mb-2 block text-sm font-medium text-grey-500">
					Select Schema
				</label>
				<select
					value={selectedSchemaId}
					onChange={(e) => setSelectedSchemaId(e.target.value)}
					className="w-full max-w-md rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="">Choose a schema...</option>
					{schemas?.map((schema) => (
						<option key={schema._id} value={schema._id}>
							{schema.displayName} ({schema.type})
						</option>
					))}
				</select>
			</div>

			{/* Filters and Search */}
			{selectedSchemaId && (
				<div className="mb-6 flex flex-wrap items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search content..."
							className="w-full rounded-lg border border-grey-300 py-2 pl-10 pr-4 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

			{/* Empty State - No Schema Selected */}
			{!selectedSchemaId && (
				<div className="rounded-lg bg-white p-12 text-center shadow">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-100">
						<FileText className="h-8 w-8 text-grey-400" />
					</div>
					<h3 className="mb-2 text-xl font-semibold text-primary">
						Select a Schema
					</h3>
					<p className="text-grey-500">
						Choose a schema from the dropdown above to view and manage content
					</p>
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
						Create your first content entry for {selectedSchema?.displayName}
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
					<table className="w-full">
						<thead className="bg-grey-100">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-semibold uppercase text-grey-500">
									Content
								</th>
								<th className="px-6 py-3 text-left text-xs font-semibold uppercase text-grey-500">
									Status
								</th>
								{(selectedSchema?.type === "page" ||
									selectedSchema?.type === "collection") && (
									<th className="px-6 py-3 text-left text-xs font-semibold uppercase text-grey-500">
										Slug
									</th>
								)}
								<th className="px-6 py-3 text-left text-xs font-semibold uppercase text-grey-500">
									Updated
								</th>
								<th className="px-6 py-3 text-right text-xs font-semibold uppercase text-grey-500">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-grey-200">
							{filteredContent.map((item) => {
								// Get first text field for preview
								const firstTextField = selectedSchema?.fields.find(
									(f) => f.type === "shortText" || f.type === "longText",
								)
								const previewText = firstTextField
									? item.data[firstTextField.name]
									: "No preview"

								return (
									<tr key={item._id} className="hover:bg-grey-50">
										<td className="px-6 py-4">
											<div className="font-medium text-primary">
												{previewText || "Untitled"}
											</div>
											{item.seo?.title && (
												<div className="text-sm text-grey-500">
													{item.seo.title}
												</div>
											)}
										</td>
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
										{(selectedSchema?.type === "page" ||
											selectedSchema?.type === "collection") && (
											<td className="px-6 py-4 text-sm text-grey-500">
												{item.slug ? (
													<code className="rounded bg-grey-100 px-2 py-1 font-mono text-xs">
														/{item.slug}
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
												{item.status === "published" && item.slug && (
													<button
														type="button"
														className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100"
														title="Preview"
													>
														<Eye className="h-4 w-4" />
													</button>
												)}
												<Link
													href={`/content/${item._id}`}
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
	)
}
