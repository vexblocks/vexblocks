"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useCachedQuery } from "@/lib/use-cached-query"
import { api } from "@repo/backend/convex/_generated/api"

export default function AdminDashboard() {
	const router = useRouter()

	// Use cached query - shows cached data instantly on navigation
	const {
		data: schemas,
		isPending,
		error,
	} = useCachedQuery(api.cms.schemas.list, {})

	// Redirect to login if not authenticated (error indicates auth failure)
	useEffect(() => {
		if (error) {
			router.push("/login")
		}
	}, [error, router])

	// Show loading state only on initial load (not on navigation)
	if (isPending && !schemas) {
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
	if (error || !schemas) {
		return null
	}

	const schemaStats = {
		global: schemas.filter((s) => s.type === "global").length,
		collections: schemas.filter((s) => s.type === "collection").length,
	}

	return (
		<div>
			<h1 className="mb-6 text-3xl font-bold text-primary">Dashboard</h1>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Schema Stats */}
				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 text-sm font-semibold text-grey-500 uppercase">
						Total Schemas
					</h3>
					<p className="text-4xl font-bold text-primary">
						{schemas?.length || 0}
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 text-sm font-semibold text-grey-500 uppercase">
						Global Components
					</h3>
					<p className="text-4xl font-bold text-secondary">
						{schemaStats.global}
					</p>
				</div>

				<div className="rounded-lg bg-white p-6 shadow">
					<h3 className="mb-2 text-sm font-semibold text-grey-500 uppercase">
						Collections
					</h3>
					<p className="text-4xl font-bold text-green">
						{schemaStats.collections}
					</p>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="mt-8">
				<h2 className="mb-4 text-xl font-semibold text-primary">
					Quick Actions
				</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Link
						href="/schemas/new"
						className="block rounded-lg bg-primary p-6 text-white transition-colors hover:bg-primary-800"
					>
						<h3 className="mb-2 text-lg font-semibold">Create Schema</h3>
						<p className="text-sm opacity-90">Define a new content type</p>
					</Link>

					<Link
						href="/content/new"
						className="block rounded-lg bg-secondary p-6 text-white transition-colors hover:bg-secondary-dark"
					>
						<h3 className="mb-2 text-lg font-semibold">Add Content</h3>
						<p className="text-sm opacity-90">Create new content entry</p>
					</Link>

					<Link
						href="/media"
						className="block rounded-lg bg-tertiary p-6 text-white transition-colors hover:bg-tertiary-light"
					>
						<h3 className="mb-2 text-lg font-semibold">Upload Media</h3>
						<p className="text-sm opacity-90">Add images to library</p>
					</Link>

					<Link
						href="/schemas"
						className="block rounded-lg bg-green p-6 text-white transition-colors hover:bg-green-light"
					>
						<h3 className="mb-2 text-lg font-semibold">Manage Schemas</h3>
						<p className="text-sm opacity-90">View and edit schemas</p>
					</Link>
				</div>
			</div>

			{/* Recent Schemas */}
			{schemas.length > 0 && (
				<div className="mt-8">
					<h2 className="mb-4 text-xl font-semibold text-primary">
						Recent Schemas
					</h2>
					<div className="overflow-hidden rounded-lg bg-white shadow">
						<table className="w-full">
							<thead className="bg-grey-100">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
										Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
										Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
										Fields
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold text-grey-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-grey-200">
								{schemas.slice(0, 5).map((schema) => (
									<tr key={schema._id} className="hover:bg-grey-50">
										<td className="px-6 py-4 text-sm font-medium text-primary">
											{schema.displayName}
										</td>
										<td className="px-6 py-4 text-sm text-grey-500">
											<span className="inline-flex rounded-full bg-grey-200 px-2 py-1 text-xs font-semibold">
												{schema.type}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-grey-500">
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
