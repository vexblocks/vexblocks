"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { Grid3x3, Layers, Plus } from "lucide-react"
import Link from "next/link"
import { useCachedQuery } from "@/lib/use-cached-query"

export default function SchemasPage() {
	// Use cached query - shows cached data instantly on navigation
	const { data: schemas, isPending } = useCachedQuery(api.cms.schemas.list, {})

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "global":
				return <Grid3x3 className="h-5 w-5" />
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
					<h1 className="font-bold text-3xl text-primary">Schemas</h1>
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

			{/* Loading State - only on initial load */}
			{isPending && !schemas && (
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
					<h3 className="mb-2 font-semibold text-primary text-xl">
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
						<div
							key={schema._id}
							className="group block rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg"
						>
							<Link href={`/schemas/${schema._id}`}>
								<div className="mb-4 flex items-start justify-between">
									<div
										className={`flex h-12 w-12 items-center justify-center rounded-lg ${getTypeColor(schema.type)}`}
									>
										{getTypeIcon(schema.type)}
									</div>
									<span
										className={`rounded-full px-3 py-1 font-semibold text-xs ${
											schema.type === "global"
												? "bg-purple-light text-purple"
												: "bg-secondary-light text-primary"
										}`}
									>
										{schema.type}
									</span>
								</div>

								<h3 className="mb-2 font-semibold text-primary text-xl group-hover:text-primary-800">
									{schema.displayName}
								</h3>

								{schema.description && (
									<p className="mb-4 line-clamp-2 text-grey-500 text-sm">
										{schema.description}
									</p>
								)}
							</Link>

							<div className="flex items-center justify-between border-grey-200 border-t pt-4 text-sm">
								<span className="text-grey-500">
									{schema.fields.length} field
									{schema.fields.length !== 1 ? "s" : ""}
								</span>
								<Link
									href={`/schemas/${schema._id}?mode=edit`}
									className="font-medium text-primary hover:underline"
								>
									Edit →
								</Link>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Schema Types Info */}
			{schemas && schemas.length > 0 && (
				<div className="mt-12 grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border-2 border-purple-light bg-purple-light/10 p-6">
						<div className="mb-2 flex items-center gap-2">
							<Grid3x3 className="h-5 w-5 text-purple" />
							<h4 className="font-semibold text-purple">Global Components</h4>
						</div>
						<p className="text-grey-500 text-sm">
							Singleton content like headers, footers, or site settings
						</p>
					</div>

					<div className="rounded-lg border-2 border-secondary-light bg-secondary-light/10 p-6">
						<div className="mb-2 flex items-center gap-2">
							<Layers className="h-5 w-5 text-secondary" />
							<h4 className="font-semibold text-secondary">Collections</h4>
						</div>
						<p className="text-grey-500 text-sm">
							Repeatable content like blog posts, pages, products, or team
							members
						</p>
					</div>
				</div>
			)}
		</div>
	)
}
