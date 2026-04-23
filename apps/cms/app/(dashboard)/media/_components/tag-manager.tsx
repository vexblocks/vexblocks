"use client"

import { useAtom } from "@lfades/atom"
import { useMutation, useQuery } from "convex/react"
import { Edit2, Plus, Save, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authAtom } from "@/lib/auth-atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

type TagManagerProps = {
	onClose?: () => void
}

export function TagManager({ onClose }: TagManagerProps) {
	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	// Query tags only when auth is ready
	const tags = useQuery(api.cms.mediaTags.list, isReady ? {} : "skip")
	const upsertTag = useMutation(api.cms.mediaTags.upsert)
	const updateTag = useMutation(api.cms.mediaTags.update)
	const removeTag = useMutation(api.cms.mediaTags.remove)

	const [isCreating, setIsCreating] = useState(false)
	const [editingId, setEditingId] = useState<Id<"cmsMediaTags"> | null>(null)
	const [newTagName, setNewTagName] = useState("")
	const [editTagName, setEditTagName] = useState("")

	const handleCreate = async () => {
		if (!newTagName.trim()) {
			toast.error("Tag name cannot be empty")
			return
		}

		try {
			await upsertTag({ name: newTagName.trim() })
			toast.success("Tag created successfully")
			setNewTagName("")
			setIsCreating(false)
		} catch (_error) {
			toast.error("Failed to create tag")
		}
	}

	const handleUpdate = async (id: Id<"cmsMediaTags">) => {
		if (!editTagName.trim()) {
			toast.error("Tag name cannot be empty")
			return
		}

		try {
			await updateTag({ id, name: editTagName.trim() })
			toast.success("Tag updated successfully")
			setEditingId(null)
			setEditTagName("")
		} catch (_error) {
			toast.error("Failed to update tag")
		}
	}

	const handleDelete = async (id: Id<"cmsMediaTags">, name: string) => {
		if (!confirm(`Are you sure you want to delete the tag "${name}"?`)) {
			return
		}

		try {
			await removeTag({ id })
			toast.success("Tag deleted successfully")
		} catch (error: any) {
			toast.error(error?.message || "Failed to delete tag")
		}
	}

	const startEditing = (id: Id<"cmsMediaTags">, currentName: string) => {
		setEditingId(id)
		setEditTagName(currentName)
	}

	const cancelEditing = () => {
		setEditingId(null)
		setEditTagName("")
	}

	return (
		<div className="rounded-lg bg-white p-6 shadow-md">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-primary">Manage Tags</h2>
				{onClose && (
					<button
						type="button"
						onClick={onClose}
						className="hover:text-grey-700 text-grey-500"
					>
						<X className="h-5 w-5" />
					</button>
				)}
			</div>

			{/* Create New Tag */}
			<div className="mb-4">
				{isCreating ? (
					<div className="flex gap-2">
						<input
							type="text"
							value={newTagName}
							onChange={(e) => setNewTagName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate()
								if (e.key === "Escape") {
									setIsCreating(false)
									setNewTagName("")
								}
							}}
							placeholder="Enter tag name..."
							className="flex-1 rounded-lg border border-grey-300 px-3 py-2 text-grey-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleCreate}
							className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-800"
						>
							<Save className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => {
								setIsCreating(false)
								setNewTagName("")
							}}
							className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 hover:bg-grey-100"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setIsCreating(true)}
						className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-grey-300 px-4 py-2 text-grey-500 transition-colors hover:border-primary hover:text-primary"
					>
						<Plus className="h-4 w-4" />
						Create New Tag
					</button>
				)}
			</div>

			{/* Tags List */}
			<div className="space-y-2">
				{tags === undefined ? (
					<div className="py-8 text-center text-sm text-grey-500">
						Loading tags...
					</div>
				) : tags.length === 0 ? (
					<div className="py-8 text-center text-sm text-grey-500">
						No tags yet. Create one to get started.
					</div>
				) : (
					tags
						.sort((a, b) => b.usageCount - a.usageCount)
						.map((tag) => {
							const isEditing = editingId === tag._id

							return (
								<div
									key={tag._id}
									className="bg-grey-50 flex items-center gap-2 rounded-lg border border-grey-200 p-3"
								>
									{isEditing ? (
										<>
											<input
												type="text"
												value={editTagName}
												onChange={(e) => setEditTagName(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleUpdate(tag._id)
													if (e.key === "Escape") cancelEditing()
												}}
												className="flex-1 rounded border border-grey-300 px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
											/>
											<button
												type="button"
												onClick={() => handleUpdate(tag._id)}
												className="rounded bg-primary p-1.5 text-white hover:bg-primary-800"
											>
												<Save className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={cancelEditing}
												className="rounded border border-grey-300 p-1.5 text-grey-500 hover:bg-grey-100"
											>
												<X className="h-4 w-4" />
											</button>
										</>
									) : (
										<>
											<span className="text-grey-900 flex-1 text-sm font-medium">
												{tag.name}
											</span>
											<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
												{tag.usageCount} uses
											</span>
											<button
												type="button"
												onClick={() => startEditing(tag._id, tag.name)}
												className="rounded p-1.5 text-grey-500 hover:bg-grey-200"
											>
												<Edit2 className="h-4 w-4" />
											</button>
											<button
												type="button"
												onClick={() => handleDelete(tag._id, tag.name)}
												disabled={tag.usageCount > 0}
												className="rounded p-1.5 text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
												title={
													tag.usageCount > 0
														? "Cannot delete tag that is in use"
														: "Delete tag"
												}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</>
									)}
								</div>
							)
						})
				)}
			</div>
		</div>
	)
}
