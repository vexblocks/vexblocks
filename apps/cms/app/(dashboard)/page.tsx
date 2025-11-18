"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminDashboard() {
	const router = useRouter()
	const schemas = useQuery(api.cms.schemas.list)

	// Redirect to login if not authenticated
	useEffect(() => {
		if (schemas === null) {
			router.push("/login")
		}
	}, [schemas, router])

	// Show loading state while checking auth
	if (schemas === undefined) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
	}

	// Return null while redirecting
	if (schemas === null) {
		return null
	}

	const schemaStats = {
		global: schemas.filter((s) => s.type === "global").length,
		pages: schemas.filter((s) => s.type === "page").length,
		collections: schemas.filter((s) => s.type === "collection").length,
	}

	return (
		<div>
			<h1 className="mb-6 font-bold text-3xl text-primary">Dashboard</h1>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Schema Stats */}
				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 font-semibold text-grey-500 text-sm uppercase">
						Total Schemas
					</h3>
					<p className="font-bold text-4xl text-primary">
						{schemas?.length || 0}
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 font-semibold text-grey-500 text-sm uppercase">
						Global Components
					</h3>
					<p className="font-bold text-4xl text-secondary">
						{schemaStats.global}
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 font-semibold text-grey-500 text-sm uppercase">
						Pages
					</h3>
					<p className="font-bold text-4xl text-tertiary">
						{schemaStats.pages}
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 font-semibold text-grey-500 text-sm uppercase">
						Collections
					</h3>
					<p className="font-bold text-4xl text-green">
						{schemaStats.collections}
					</p>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="mt-8">
				<h2 className="mb-4 font-semibold text-primary text-xl">
					Quick Actions
				</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Link
						href="/schemas/new"
						className="block rounded-lg bg-primary p-6 text-white transition-colors hover:bg-primary-800"
					>
						<h3 className="mb-2 font-semibold text-lg">Create Schema</h3>
						<p className="text-sm opacity-90">Define a new content type</p>
					</Link>

					<Link
						href="/content/new"
						className="block rounded-lg bg-secondary p-6 text-white transition-colors hover:bg-secondary-dark"
					>
						<h3 className="mb-2 font-semibold text-lg">Add Content</h3>
						<p className="text-sm opacity-90">Create new content entry</p>
					</Link>

					<Link
						href="/media"
						className="block rounded-lg bg-tertiary p-6 text-white transition-colors hover:bg-tertiary-light"
					>
						<h3 className="mb-2 font-semibold text-lg">Upload Media</h3>
						<p className="text-sm opacity-90">Add images to library</p>
					</Link>

					<Link
						href="/schemas"
						className="block rounded-lg bg-green p-6 text-white transition-colors hover:bg-green-light"
					>
						<h3 className="mb-2 font-semibold text-lg">Manage Schemas</h3>
						<p className="text-sm opacity-90">View and edit schemas</p>
					</Link>
				</div>
			</div>

			{/* Recent Schemas */}
			{schemas.length > 0 && (
				<div className="mt-8">
					<h2 className="mb-4 font-semibold text-primary text-xl">
						Recent Schemas
					</h2>
					<div className="overflow-hidden rounded-lg bg-white shadow">
						<table className="w-full">
							<thead className="bg-grey-100">
								<tr>
									<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
										Name
									</th>
									<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
										Type
									</th>
									<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
										Fields
									</th>
									<th className="px-6 py-3 text-left font-semibold text-grey-500 text-xs uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-grey-200">
								{schemas.slice(0, 5).map((schema) => (
									<tr key={schema._id} className="hover:bg-grey-50">
										<td className="px-6 py-4 font-medium text-primary text-sm">
											{schema.displayName}
										</td>
										<td className="px-6 py-4 text-grey-500 text-sm">
											<span className="inline-flex rounded-full bg-grey-200 px-2 py-1 font-semibold text-xs">
												{schema.type}
											</span>
										</td>
										<td className="px-6 py-4 text-grey-500 text-sm">
											{schema.fields.length} fields
										</td>
										<td className="px-6 py-4 text-sm">
											<Link
												href={`/schemas/${schema._id}`}
												className="text-primary hover:underline"
											>
												Edit
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	)
}
