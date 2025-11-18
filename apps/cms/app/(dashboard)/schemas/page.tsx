"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import Link from "next/link"
import { Plus, Layers, FileText, Grid3x3 } from "lucide-react"

export default function SchemasPage() {
	const schemas = useQuery(api.cms.schemas.list)

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "global":
				return <Grid3x3 className="h-5 w-5" />
			case "page":
				return <FileText className="h-5 w-5" />
			case "collection":
				return <Layers className="h-5 w-5" />
			default:
				return null
		}
	}

	const getTypeColor = (type: string) => {
		switch (type) {
			case "global":
				return "bg-purple text-white"
			case "page":
				return "bg-tertiary text-white"
			case "collection":
				return "bg-secondary text-white"
			default:
				return "bg-grey-200 text-grey-500"
		}
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-primary">Schemas</h1>
					<p className="mt-2 text-grey-500">
						Define content types for your CMS
					</p>
				</div>
				<Link
					href="/schemas/new"
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
				>
					<Plus className="h-5 w-5" />
					Create Schema
				</Link>
			</div>

			{/* Loading State */}
			{schemas === undefined && (
				<div className="rounded-lg bg-white p-12 text-center shadow">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="mt-4 text-grey-500">Loading schemas...</p>
				</div>
			)}

			{/* Empty State */}
			{schemas && schemas.length === 0 && (
				<div className="rounded-lg bg-white p-12 text-center shadow">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-100">
						<Layers className="h-8 w-8 text-grey-400" />
					</div>
					<h3 className="mb-2 text-xl font-semibold text-primary">
						No schemas yet
					</h3>
					<p className="mb-6 text-grey-500">
						Get started by creating your first content schema
					</p>
					<Link
						href="/schemas/new"
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800"
					>
						<Plus className="h-5 w-5" />
						Create Your First Schema
					</Link>
				</div>
			)}

			{/* Schemas Grid */}
			{schemas && schemas.length > 0 && (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{schemas.map((schema) => (
						<Link
							key={schema._id}
							href={`/schemas/${schema._id}`}
							className="group block rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg"
						>
							<div className="mb-4 flex items-start justify-between">
								<div
									className={`flex h-12 w-12 items-center justify-center rounded-lg ${getTypeColor(schema.type)}`}
								>
									{getTypeIcon(schema.type)}
								</div>
								<span
									className={`rounded-full px-3 py-1 text-xs font-semibold ${
										schema.type === "global"
											? "bg-purple-light text-purple"
											: schema.type === "page"
												? "bg-tertiary-light text-tertiary"
												: "bg-secondary-light text-secondary"
									}`}
								>
									{schema.type}
								</span>
							</div>

							<h3 className="mb-2 text-xl font-semibold text-primary group-hover:text-primary-800">
								{schema.displayName}
							</h3>

							{schema.description && (
								<p className="mb-4 text-sm text-grey-500 line-clamp-2">
									{schema.description}
								</p>
							)}

							<div className="flex items-center justify-between border-t border-grey-200 pt-4 text-sm">
								<span className="text-grey-500">
									{schema.fields.length} field
									{schema.fields.length !== 1 ? "s" : ""}
								</span>
								<span className="font-medium text-primary group-hover:underline">
									Edit →
								</span>
							</div>
						</Link>
					))}
				</div>
			)}

			{/* Schema Types Info */}
			{schemas && schemas.length > 0 && (
				<div className="mt-12 grid gap-4 md:grid-cols-3">
					<div className="rounded-lg border-2 border-purple-light bg-purple-light/10 p-6">
						<div className="mb-2 flex items-center gap-2">
							<Grid3x3 className="h-5 w-5 text-purple" />
							<h4 className="font-semibold text-purple">Global Components</h4>
						</div>
						<p className="text-sm text-grey-500">
							Singleton content like headers, footers, or site settings
						</p>
					</div>

					<div className="rounded-lg border-2 border-tertiary-light bg-tertiary-light/10 p-6">
						<div className="mb-2 flex items-center gap-2">
							<FileText className="h-5 w-5 text-tertiary" />
							<h4 className="font-semibold text-tertiary">Pages</h4>
						</div>
						<p className="text-sm text-grey-500">
							Unique pages with their own URLs (about, contact, etc.)
						</p>
					</div>

					<div className="rounded-lg border-2 border-secondary-light bg-secondary-light/10 p-6">
						<div className="mb-2 flex items-center gap-2">
							<Layers className="h-5 w-5 text-secondary" />
							<h4 className="font-semibold text-secondary">Collections</h4>
						</div>
						<p className="text-sm text-grey-500">
							Repeatable content like blog posts, products, or team members
						</p>
					</div>
				</div>
			)}
		</div>
	)
}
