"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Ban,
	CheckCircle,
	Edit,
	Mail,
	MailPlus,
	RefreshCw,
	Shield,
	Trash2,
	UserPlus,
	Users as UsersIcon,
	X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useCachedQuery } from "@/lib/use-cached-query"

type UserRole = "admin" | "editor" | "developer" | "user"

type User = {
	_id: Id<"users">
	_creationTime: number
	name?: string
	email: string
	role: UserRole
	profilePictureUrl?: string
	isActive?: boolean
}

type Invitation = {
	_id: Id<"cmsUserInvitations">
	_creationTime: number
	email: string
	role: UserRole
	status: "pending" | "accepted"
	invitedAt: number
	acceptedAt?: number
	invitedBy: {
		_id: Id<"users">
		name?: string
		email: string
	}
}

export default function UsersPage() {
	// Queries
	const { data: users, isPending: usersLoading } = useCachedQuery(
		api.cms.users.list,
		{},
	)
	const { data: stats, isPending: statsLoading } = useCachedQuery(
		api.cms.users.getStats,
		{},
	)
	const { data: invitations, isPending: invitationsLoading } = useCachedQuery(
		api.cms.invitations.list,
		{},
	)

	// Mutations
	const updateUser = useMutation(api.cms.users.update)
	const deleteUser = useMutation(api.cms.users.remove)
	const toggleUserActive = useMutation(api.cms.users.toggleActive)
	const createInvitation = useMutation(api.cms.invitations.create)
	const resendInvitation = useMutation(api.cms.invitations.resend)
	const deleteInvitation = useMutation(api.cms.invitations.remove)

	// State
	const [editingUser, setEditingUser] = useState<User | null>(null)
	const [deletingUser, setDeletingUser] = useState<User | null>(null)
	const [invitingUser, setInvitingUser] = useState(false)
	const [deletingInvitation, setDeletingInvitation] =
		useState<Invitation | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Edit form state
	const [editName, setEditName] = useState("")
	const [editRole, setEditRole] = useState<UserRole>("user")

	// Invite form state
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState<UserRole>("user")

	// Handlers
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

	const handleToggleActive = async (userId: Id<"users">, isActive: boolean) => {
		setLoading(true)
		setError("")

		try {
			await toggleUserActive({ id: userId, isActive })
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to toggle user status",
			)
		} finally {
			setLoading(false)
		}
	}

	const handleInviteUser = async () => {
		setLoading(true)
		setError("")

		try {
			await createInvitation({
				email: inviteEmail,
				role: inviteRole,
			})
			setInvitingUser(false)
			setInviteEmail("")
			setInviteRole("user")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send invitation")
		} finally {
			setLoading(false)
		}
	}

	const handleResendInvitation = async (
		invitationId: Id<"cmsUserInvitations">,
	) => {
		setLoading(true)
		setError("")

		try {
			await resendInvitation({ invitationId })
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to resend invitation",
			)
		} finally {
			setLoading(false)
		}
	}

	const handleDeleteInvitation = async () => {
		if (!deletingInvitation) return

		setLoading(true)
		setError("")

		try {
			await deleteInvitation({ invitationId: deletingInvitation._id })
			setDeletingInvitation(null)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete invitation",
			)
		} finally {
			setLoading(false)
		}
	}

	const getRoleBadgeColor = (role: UserRole) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-700"
			case "editor":
				return "bg-blue-100 text-blue-700"
			case "developer":
				return "bg-purple-100 text-purple-700"
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

	const getStatusBadgeColor = (status: "pending" | "accepted") => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-700"
			case "accepted":
				return "bg-green-100 text-green-700"
		}
	}

	// Check for unauthorized access
	if (users === null || stats === null || invitations === null) {
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

	// Show loading
	if (
		(usersLoading && !users) ||
		(statsLoading && !stats) ||
		(invitationsLoading && !invitations)
	) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
	}

	if (!users || !stats || !invitations) {
		return null
	}

	const pendingInvitations = invitations.filter(
		(inv) => inv.status === "pending",
	)

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

			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-primary">User Management</h1>
					<p className="mt-2 text-grey-500">
						Manage user accounts, roles, and permissions
					</p>
				</div>
				<button
					type="button"
					onClick={() => setInvitingUser(true)}
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800"
				>
					<UserPlus className="h-4 w-4" />
					Invite User
				</button>
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
							<p className="mt-1 font-bold text-2xl text-blue-700">
								{stats.editors}
							</p>
						</div>
						<Edit className="h-8 w-8 text-blue-500" />
					</div>
				</div>
				<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-grey-500 text-sm">Developers</p>
							<p className="mt-1 font-bold text-2xl text-purple-700">
								{stats.developers}
							</p>
						</div>
						<Shield className="h-8 w-8 text-purple-500" />
					</div>
				</div>
			</div>

			{/* Pending Invitations */}
			{pendingInvitations.length > 0 && (
				<div className="mb-8">
					<h2 className="mb-4 font-bold text-grey-900 text-xl">
						Pending Invitations ({pendingInvitations.length})
					</h2>
					<div className="rounded-lg bg-white shadow-md">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="border-grey-200 border-b bg-grey-50">
									<tr>
										<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
											Email
										</th>
										<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
											Role
										</th>
										<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
											Invited By
										</th>
										<th className="px-6 py-3 text-left font-medium text-grey-700 text-xs uppercase tracking-wider">
											Sent
										</th>
										<th className="px-6 py-3 text-right font-medium text-grey-700 text-xs uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-grey-200">
									{pendingInvitations.map((invitation) => (
										<tr key={invitation._id} className="hover:bg-grey-50">
											<td className="whitespace-nowrap px-6 py-4">
												<div className="flex items-center gap-2">
													<Mail className="h-4 w-4 text-grey-400" />
													<span className="text-grey-900 text-sm">
														{invitation.email}
													</span>
												</div>
											</td>
											<td className="whitespace-nowrap px-6 py-4">
												<span
													className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-xs ${getRoleBadgeColor(invitation.role)}`}
												>
													{getRoleIcon(invitation.role)}
													{invitation.role}
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-grey-700 text-sm">
												{invitation.invitedBy.name ||
													invitation.invitedBy.email}
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-grey-500 text-sm">
												{new Date(invitation.invitedAt).toLocaleDateString()}
											</td>
											<td className="whitespace-nowrap px-6 py-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => {
															handleResendInvitation(invitation._id)
															toast.success("Invitation resent")
														}}
														disabled={loading}
														className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100 hover:text-primary disabled:opacity-50"
														title="Resend invitation"
													>
														<RefreshCw className="h-4 w-4" />
													</button>
													<button
														type="button"
														onClick={() => {
															setDeletingInvitation(invitation)
															toast.success("Invitation deleted")
														}}
														disabled={loading}
														className="rounded p-2 text-grey-500 transition-colors hover:bg-red-50 hover:text-error disabled:opacity-50"
														title="Delete invitation"
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
				</div>
			)}

			{/* Users Table */}
			<div className="mb-4">
				<h2 className="font-bold text-grey-900 text-xl">
					All Users ({users.length})
				</h2>
			</div>
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
									Status
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
									<td className="whitespace-nowrap px-6 py-4">
										{user.isActive !== false ? (
											<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-700 text-xs">
												<CheckCircle className="h-3 w-3" />
												Active
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-700 text-xs">
												<Ban className="h-3 w-3" />
												Disabled
											</span>
										)}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-grey-500 text-sm">
										{new Date(user._creationTime).toLocaleDateString()}
									</td>
									<td className="whitespace-nowrap px-6 py-4 text-right">
										<div className="flex items-center justify-end gap-2">
											<button
												type="button"
												onClick={() => handleEditUser(user)}
												disabled={loading}
												className="rounded p-2 text-grey-500 transition-colors hover:bg-grey-100 hover:text-primary disabled:opacity-50"
												title="Edit user"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													handleToggleActive(user._id, !user.isActive)
												}
												disabled={loading}
												className={`rounded p-2 transition-colors disabled:opacity-50 ${
													user.isActive
														? "text-grey-500 hover:bg-yellow-50 hover:text-yellow-600"
														: "text-grey-500 hover:bg-green-50 hover:text-green-600"
												}`}
												title={user.isActive ? "Disable user" : "Enable user"}
											>
												{user.isActive ? (
													<Ban className="h-4 w-4" />
												) : (
													<CheckCircle className="h-4 w-4" />
												)}
											</button>
											<button
												type="button"
												onClick={() => setDeletingUser(user)}
												disabled={loading}
												className="rounded p-2 text-grey-500 transition-colors hover:bg-red-50 hover:text-error disabled:opacity-50"
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

			{/* Invite User Modal */}
			{invitingUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-bold text-primary text-xl">
								Invite New User
							</h2>
							<button
								type="button"
								onClick={() => {
									setInvitingUser(false)
									setInviteEmail("")
									setInviteRole("user")
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

						<div className="space-y-4">
							<div>
								<label
									htmlFor="invite-email"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Email Address
								</label>
								<input
									type="email"
									id="invite-email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									placeholder="user@example.com"
									className="w-full rounded-lg border border-grey-300 px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>

							<div>
								<label
									htmlFor="invite-role"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Role
								</label>
								<select
									id="invite-role"
									value={inviteRole}
									onChange={(e) => setInviteRole(e.target.value as UserRole)}
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
									setInvitingUser(false)
									setInviteEmail("")
									setInviteRole("user")
									setError("")
								}}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleInviteUser}
								disabled={loading || !inviteEmail}
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							>
								{loading ? (
									<>
										<RefreshCw className="h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<MailPlus className="h-4 w-4" />
										Send Invitation
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Edit User Modal (same as before) */}
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

			{/* Delete User Modal (same as before) */}
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

			{/* Delete Invitation Modal */}
			{deletingInvitation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light/20">
								<AlertTriangle className="h-6 w-6 text-error" />
							</div>
							<h3 className="font-semibold text-lg text-primary">
								Delete Invitation
							</h3>
						</div>

						{error && (
							<div className="mb-4 rounded-lg bg-red-50 p-3">
								<p className="text-error text-sm">{error}</p>
							</div>
						)}

						<p className="mb-6 text-grey-600">
							Are you sure you want to delete the invitation for{" "}
							<strong>{deletingInvitation.email}</strong>?
						</p>

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setDeletingInvitation(null)
									setError("")
								}}
								disabled={loading}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteInvitation}
								disabled={loading}
								className="rounded-lg bg-error px-4 py-2 text-white transition-colors hover:bg-error-light disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete Invitation"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
