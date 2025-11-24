"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Edit,
	Shield,
	Trash2,
	Users as UsersIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

type UserRole = "admin" | "editor" | "developer" | "user"

type User = {
	_id: Id<"users">
	_creationTime: number
	name?: string
	email: string
	role: UserRole
	profilePictureUrl?: string
}

export default function UsersPage() {
	const users = useQuery(api.users.list)
	const stats = useQuery(api.users.getStats)
	const updateUser = useMutation(api.users.update)
	const deleteUser = useMutation(api.users.remove)

	const [editingUser, setEditingUser] = useState<User | null>(null)
	const [deletingUser, setDeletingUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Edit form state
	const [editName, setEditName] = useState("")
	const [editRole, setEditRole] = useState<UserRole>("user")

	const handleEditUser = (user: User) => {
		setEditingUser(user)
		setEditName(user.name || "")
		setEditRole(user.role)
		setError("")
	}

	const handleSaveEdit = async () => {
		if (!editingUser) return

		setLoading(true)
		setError("")

		try {
			await updateUser({
				id: editingUser._id,
				name: editName || undefined,
				role: editRole,
			})
			setEditingUser(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update user")
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteUser = async () => {
		if (!deletingUser) return

		setLoading(true)
		setError("")

		try {
			await deleteUser({ id: deletingUser._id })
			setDeletingUser(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete user")
		} finally {
			setLoading(false)
		}
	}

	const getRoleBadgeColor = (role: UserRole) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-700"
			case "editor":
				return "bg-red-50 text-red-700"
			case "developer":
				return "bg-red-100 text-red-800"
			default:
				return "bg-grey-100 text-grey-700"
		}
	}

	const getRoleIcon = (role: UserRole) => {
		if (role === "admin") {
			return <Shield className="h-3 w-3" />
		}
		return null
	}

	// Check for unauthorized access (query returns null when user is not admin)
	if (users === null || stats === null) {
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
						You don't have permission to access user management. This feature is
						only available to administrators.
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

	if (users === undefined || stats === undefined) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading users...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-6">
				<Link
					href="/settings"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Settings
				</Link>
			</div>

			<div className="mb-8">
				<h1 className="font-bold text-3xl">User Management</h1>
				<p className="mt-2 text-grey-500">
					Manage user accounts, roles, and permissions
				</p>
			</div>

			{/* Stats Cards */}
			<div className="mb-8 grid gap-4 md:grid-cols-4">
				<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-grey-500 text-sm">Total Users</p>
							<p className="mt-1 font-bold text-2xl text-grey-900">
								{stats.total}
							</p>
						</div>
						<UsersIcon className="h-8 w-8 text-primary" />
					</div>
				</div>
				<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-grey-500 text-sm">Admins</p>
							<p className="mt-1 font-bold text-2xl text-red-700">
								{stats.admins}
							</p>
						</div>
						<Shield className="h-8 w-8 text-red-500" />
					</div>
				</div>
				<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-grey-500 text-sm">Editors</p>
							<p className="mt-1 font-bold text-2xl text-red-700">
								{stats.editors}
							</p>
						</div>
						<Edit className="h-8 w-8 text-red-500" />
					</div>
				</div>
				<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-grey-500 text-sm">Developers</p>
							<p className="mt-1 font-bold text-2xl text-red-800">
								{stats.developers}
							</p>
						</div>
						<Shield className="h-8 w-8 text-red-600" />
					</div>
				</div>
			</div>

			{/* Users Table */}
			<div className="rounded-lg bg-white shadow-md">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="border-grey-200 border-b bg-grey-50">
							<tr>
								<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
									Email
								</th>
								<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
									Joined
								</th>
								<th className="px-6 py-3 text-right font-medium text-grey-700 text-xs uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-grey-200">
							{users.map((user) => (
								<tr key={user._id} className="hover:bg-grey-50">
									<td className="whitespace-nowrap px-6 py-4">
										<div className="flex items-center gap-3">
											{user.profilePictureUrl ? (
												<Image
													src={user.profilePictureUrl}
													alt={user.name || user.email}
													width={40}
													height={40}
													className="size-10 rounded-full object-cover"
												/>
											) : (
												<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
													{(user.name || user.email)[0].toUpperCase()}
												</div>
											)}
											<div>
												<p className="font-medium text-grey-900 text-sm">
													{user.name || "—"}
												</p>
											</div>
										</div>
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<p className="text-grey-700 text-sm">{user.email}</p>
									</td>
									<td className="whitespace-nowrap px-6 py-4">
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-xs ${getRoleBadgeColor(user.role)}`}
										>
											{getRoleIcon(user.role)}
											{user.role}
										</span>
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-grey-500 text-sm">
										{new Date(user._creationTime).toLocaleDateString()}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right">
										<div className="flex items-center justify-end gap-2">
											<button
												type="button"
												onClick={() => handleEditUser(user)}
												className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100 hover:text-primary"
												title="Edit user"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() => setDeletingUser(user)}
												className="rounded p-2 text-grey-500 transition-colors hover:bg-red-50 hover:text-error"
												title="Delete user"
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
			</div>

			{/* Edit User Modal */}
			{editingUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<h2 className="mb-4 font-bold text-primary text-xl">Edit User</h2>

						{error && (
							<div className="mb-4 rounded-lg bg-red-50 p-3">
								<p className="text-error text-sm">{error}</p>
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label
									htmlFor="edit-name"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Name
								</label>
								<input
									type="text"
									id="edit-name"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									placeholder="User Name"
									className="w-full rounded-lg border border-grey-300 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div>
								<label
									htmlFor="edit-role"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Role
								</label>
								<select
									id="edit-role"
									value={editRole}
									onChange={(e) => setEditRole(e.target.value as UserRole)}
									className="w-full rounded-lg border border-grey-300 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								>
									<option value="user">User</option>
									<option value="editor">Editor</option>
									<option value="developer">Developer</option>
									<option value="admin">Admin</option>
								</select>
								<p className="mt-1 text-grey-500 text-xs">
									Admin: Full access • Editor: Content management • Developer:
									API access • User: Basic access
								</p>
							</div>
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setEditingUser(null)
									setError("")
								}}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSaveEdit}
								disabled={loading}
								className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							>
								{loading ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deletingUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light/20">
								<AlertTriangle className="h-6 w-6 text-error" />
							</div>
							<h3 className="font-semibold text-lg text-primary">
								Delete User
							</h3>
						</div>

						{error && (
							<div className="mb-4 rounded-lg bg-red-50 p-3">
								<p className="text-error text-sm">{error}</p>
							</div>
						)}

						<p className="mb-6 text-grey-600">
							Are you sure you want to delete{" "}
							<strong>{deletingUser.email}</strong>? This action cannot be
							undone.
						</p>

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setDeletingUser(null)
									setError("")
								}}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteUser}
								disabled={loading}
								className="rounded-lg bg-error px-4 py-2 text-white transition-colors hover:bg-error-light disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete User"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
