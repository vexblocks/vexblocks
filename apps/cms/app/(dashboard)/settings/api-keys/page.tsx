"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Copy,
	Key,
	Plus,
	Shield,
	Trash2,
	X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useCachedQuery } from "@/lib/use-cached-query"

type ApiKey = {
	_id: Id<"cmsApiKeys">
	_creationTime: number
	name: string
	keyPrefix: string
	createdBy: Id<"users">
	createdAt: number
	lastUsedAt?: number
	revokedAt?: number
}

export default function ApiKeysPage() {
	const { data: apiKeys, isPending } = useCachedQuery(api.cms.apiKeys.list, {})

	const createKey = useMutation(api.cms.apiKeys.create)
	const revokeKey = useMutation(api.cms.apiKeys.revoke)
	const deleteKey = useMutation(api.cms.apiKeys.remove)

	const [creating, setCreating] = useState(false)
	const [newKeyName, setNewKeyName] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Shown once after creation
	const [createdKey, setCreatedKey] = useState<{
		rawKey: string
		name: string
	} | null>(null)
	const [copied, setCopied] = useState(false)

	const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null)

	const handleCreate = async () => {
		if (!newKeyName.trim()) return
		setLoading(true)
		setError("")
		try {
			const result = await createKey({ name: newKeyName.trim() })
			if (!result) throw new Error("Failed to create key")
			setCreatedKey({ rawKey: result.rawKey, name: newKeyName.trim() })
			setCreating(false)
			setNewKeyName("")
			toast.success("API key created")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create key")
		} finally {
			setLoading(false)
		}
	}

	const handleRevoke = async (id: Id<"cmsApiKeys">, name: string) => {
		setLoading(true)
		try {
			await revokeKey({ id })
			toast.success(`Key "${name}" revoked`)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to revoke key")
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		if (!deletingKey) return
		setLoading(true)
		try {
			await deleteKey({ id: deletingKey._id })
			setDeletingKey(null)
			toast.success("API key deleted")
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to delete key")
		} finally {
			setLoading(false)
		}
	}

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	if (apiKeys === null) {
		return (
			<div className="mx-auto max-w-2xl">
				<div className="mb-6">
					<Link
						href="/settings"
						className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Settings
					</Link>
				</div>
				<div className="rounded-lg border-2 border-red-200 bg-red-50 p-8 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
						<Shield className="h-8 w-8 text-red-600" />
					</div>
					<h2 className="mb-2 font-bold text-2xl text-red-900">
						Access Denied
					</h2>
					<p className="mb-6 text-red-700">
						Only administrators can manage API keys.
					</p>
					<Link
						href="/settings"
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Settings
					</Link>
				</div>
			</div>
		)
	}

	if (isPending && !apiKeys) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
	}

	const activeKeys = (apiKeys ?? []).filter((k) => !k.revokedAt)
	const revokedKeys = (apiKeys ?? []).filter((k) => k.revokedAt)

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<Link
					href="/settings"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Settings
				</Link>
			</div>

			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-primary">API Keys</h1>
					<p className="mt-2 text-grey-500">
						Manage API keys for external REST API access
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setCreating(true)
						setError("")
					}}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
				>
					<Plus className="h-4 w-4" />
					New Key
				</button>
			</div>

			{/* REST API info */}
			<div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<p className="font-medium text-blue-900 text-sm">REST API Endpoints</p>
				<div className="mt-2 space-y-1 font-mono text-blue-700 text-xs">
					<p>GET /api/v1/content/:schema</p>
					<p>GET /api/v1/content/:schema/:id</p>
				</div>
				<p className="mt-2 text-blue-700 text-xs">
					Authenticate with{" "}
					<code className="rounded bg-blue-100 px-1">
						Authorization: Bearer {"<key>"}
					</code>
				</p>
			</div>

			{/* Active keys */}
			<div className="mb-8">
				<h2 className="mb-4 font-semibold text-grey-900 text-lg">
					Active Keys ({activeKeys.length})
				</h2>
				{activeKeys.length === 0 ? (
					<div className="rounded-lg border border-grey-300 border-dashed p-8 text-center">
						<Key className="mx-auto mb-3 h-10 w-10 text-grey-300" />
						<p className="text-grey-500 text-sm">No active API keys</p>
						<p className="mt-1 text-grey-400 text-xs">
							Create a key to enable external REST API access
						</p>
					</div>
				) : (
					<div className="rounded-lg bg-white shadow-sm">
						<table className="w-full">
							<thead className="border-grey-200 border-b bg-grey-50">
								<tr>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Name
									</th>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Key Prefix
									</th>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Created
									</th>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Last Used
									</th>
									<th className="px-5 py-3 text-right font-medium text-grey-700 text-xs uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-grey-100">
								{activeKeys.map((key) => (
									<tr key={key._id} className="hover:bg-grey-50">
										<td className="px-5 py-4">
											<span className="font-medium text-grey-900 text-sm">
												{key.name}
											</span>
										</td>
										<td className="px-5 py-4">
											<code className="rounded bg-grey-100 px-2 py-0.5 text-grey-600 text-xs">
												{key.keyPrefix}
											</code>
										</td>
										<td className="px-5 py-4 text-grey-500 text-sm">
											{new Date(key.createdAt).toLocaleDateString()}
										</td>
										<td className="px-5 py-4 text-grey-500 text-sm">
											{key.lastUsedAt
												? new Date(key.lastUsedAt).toLocaleDateString()
												: "Never"}
										</td>
										<td className="px-5 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<button
													type="button"
													onClick={() => handleRevoke(key._id, key.name)}
													disabled={loading}
													className="rounded px-3 py-1.5 text-amber-600 text-xs transition-colors hover:bg-amber-50 disabled:opacity-50"
													title="Revoke key"
												>
													Revoke
												</button>
												<button
													type="button"
													onClick={() => setDeletingKey(key)}
													disabled={loading}
													className="rounded p-1.5 text-grey-400 transition-colors hover:bg-red-50 hover:text-error disabled:opacity-50"
													title="Delete key"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Revoked keys */}
			{revokedKeys.length > 0 && (
				<div>
					<h2 className="mb-4 font-semibold text-grey-500 text-lg">
						Revoked Keys ({revokedKeys.length})
					</h2>
					<div className="rounded-lg bg-white opacity-60 shadow-sm">
						<table className="w-full">
							<thead className="border-grey-200 border-b bg-grey-50">
								<tr>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Name
									</th>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Key Prefix
									</th>
									<th className="px-5 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
										Revoked
									</th>
									<th className="px-5 py-3 text-right font-medium text-grey-700 text-xs uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-grey-100">
								{revokedKeys.map((key) => (
									<tr key={key._id}>
										<td className="px-5 py-4">
											<span className="text-grey-500 text-sm line-through">
												{key.name}
											</span>
										</td>
										<td className="px-5 py-4">
											<code className="rounded bg-grey-100 px-2 py-0.5 text-grey-400 text-xs">
												{key.keyPrefix}
											</code>
										</td>
										<td className="px-5 py-4 text-grey-400 text-sm">
											{key.revokedAt
												? new Date(key.revokedAt).toLocaleDateString()
												: "—"}
										</td>
										<td className="px-5 py-4 text-right">
											<button
												type="button"
												onClick={() => setDeletingKey(key)}
												disabled={loading}
												className="rounded p-1.5 text-grey-400 transition-colors hover:bg-red-50 hover:text-error disabled:opacity-50"
												title="Delete key"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Create key modal */}
			{creating && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-bold text-primary text-xl">New API Key</h2>
							<button
								type="button"
								onClick={() => {
									setCreating(false)
									setNewKeyName("")
									setError("")
								}}
								className="text-grey-400 hover:text-grey-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{error && (
							<div className="mb-4 rounded-lg bg-red-50 p-3">
								<p className="text-error text-sm">{error}</p>
							</div>
						)}

						<div>
							<label
								htmlFor="key-name"
								className="mb-1 block font-medium text-grey-700 text-sm"
							>
								Key Name
							</label>
							<input
								type="text"
								id="key-name"
								value={newKeyName}
								onChange={(e) => setNewKeyName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreate()}
								placeholder="e.g. Production, Python client"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								autoFocus
							/>
							<p className="mt-1 text-grey-400 text-xs">
								A descriptive label to identify where this key is used
							</p>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setCreating(false)
									setNewKeyName("")
									setError("")
								}}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleCreate}
								disabled={loading || !newKeyName.trim()}
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							>
								{loading ? (
									"Creating..."
								) : (
									<>
										<Key className="h-4 w-4" />
										Generate Key
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Show raw key once after creation */}
			{createdKey && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
								<Check className="h-5 w-5 text-green-600" />
							</div>
							<h2 className="font-bold text-primary text-xl">
								Key Created: {createdKey.name}
							</h2>
						</div>

						<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
							<p className="font-medium text-amber-800 text-sm">
								Copy this key now — it will not be shown again.
							</p>
						</div>

						<div className="flex items-center gap-2 rounded-lg border border-grey-200 bg-grey-50 p-3">
							<code className="flex-1 break-all text-grey-800 text-sm">
								{createdKey.rawKey}
							</code>
							<button
								type="button"
								onClick={() => handleCopy(createdKey.rawKey)}
								className="shrink-0 rounded p-2 text-grey-500 transition-colors hover:bg-grey-200"
								title="Copy to clipboard"
							>
								{copied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</button>
						</div>

						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={() => setCreatedKey(null)}
								className="rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-800"
							>
								Done
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete confirmation modal */}
			{deletingKey && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light/20">
								<AlertTriangle className="h-6 w-6 text-error" />
							</div>
							<h3 className="font-semibold text-lg text-primary">Delete Key</h3>
						</div>

						<p className="mb-6 text-grey-600">
							Are you sure you want to permanently delete{" "}
							<strong>"{deletingKey.name}"</strong>? This cannot be undone.
						</p>

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setDeletingKey(null)}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={loading}
								className="rounded-lg bg-error px-4 py-2 text-white transition-colors hover:bg-error-light disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete Key"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
