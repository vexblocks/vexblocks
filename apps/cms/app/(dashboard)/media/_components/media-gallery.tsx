"use client"

import { useAtom } from "@lfades/atom"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { AlertTriangle } from "lucide-react"
import { type RefObject, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { authAtom } from "@/lib/auth-atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { MediaCard } from "./media-card"
import { MediaFilters } from "./media-filters"
import { ReplaceMediaDialog } from "./replace-media-dialog"

type MediaGalleryProps = {
	selectionMode?: boolean
	onSelect?: (media: { id: Id<"cmsMedia">; cloudflareId: string }) => void
	selectedCloudflareId?: string
	filterType?: "all" | "images" | "files"
	scrollContainerRef?: RefObject<HTMLDivElement | null>
}

const INITIAL_PAGE_SIZE = 24

export function MediaGallery({
	selectionMode = false,
	onSelect,
	selectedCloudflareId,
	filterType = "all",
	scrollContainerRef,
}: MediaGalleryProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [editingMedia, setEditingMedia] = useState<Id<"cmsMedia"> | null>(null)
	const [deletingMedia, setDeletingMedia] = useState<Id<"cmsMedia"> | null>(
		null,
	)
	const [replacingMedia, setReplacingMedia] = useState<{
		id: Id<"cmsMedia">
		storageType?: string
		caption: string
	} | null>(null)

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null
	const loadMoreRef = useRef<HTMLDivElement | null>(null)
	const hasActiveFilters =
		searchTerm.trim().length > 0 || selectedTags.length > 0

	const {
		results: mediaItems,
		status,
		loadMore,
	} = usePaginatedQuery(
		api.cms.media.list,
		isReady && !hasActiveFilters ? {} : "skip",
		{ initialNumItems: INITIAL_PAGE_SIZE },
	)
	const filteredMediaItems = useQuery(
		api.cms.media.listFiltered,
		isReady && hasActiveFilters
			? {
					search: searchTerm || undefined,
					tags: selectedTags.length > 0 ? selectedTags : undefined,
					filterType,
				}
			: "skip",
	)

	const allTags = useQuery(api.cms.mediaTags.list, isReady ? {} : "skip")
	const updateMedia = useMutation(api.cms.media.update)
	const removeMedia = useMutation(api.cms.media.remove)
	const checkReferences = useQuery(
		api.cms.media.checkReferences,
		isReady && deletingMedia ? { mediaId: deletingMedia } : "skip",
	)

	const galleryItems = hasActiveFilters
		? (filteredMediaItems ?? [])
		: mediaItems

	const filteredByType = hasActiveFilters
		? galleryItems
		: filterType === "images"
			? galleryItems.filter((item) => item.storageType !== "r2")
			: filterType === "files"
				? galleryItems.filter((item) => item.storageType === "r2")
				: galleryItems

	const availableTags = (allTags || []).map((tag) => ({
		name: tag.name,
		count: tag.usageCount,
	}))

	useEffect(() => {
		const node = loadMoreRef.current
		if (!node || hasActiveFilters || status !== "CanLoadMore") return

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0]
				if (entry?.isIntersecting) {
					loadMore(INITIAL_PAGE_SIZE)
				}
			},
			{
				root: scrollContainerRef?.current ?? null,
				rootMargin: "300px 0px",
			},
		)

		observer.observe(node)
		return () => observer.disconnect()
	}, [hasActiveFilters, loadMore, scrollContainerRef, status])

	const handleDelete = async (id: Id<"cmsMedia">) => {
		setDeletingMedia(id)
	}

	const confirmDelete = async () => {
		if (!deletingMedia) return

		try {
			await removeMedia({ id: deletingMedia })
			toast.success("Media deleted successfully")
			setDeletingMedia(null)
		} catch (error: any) {
			toast.error(error?.message || "Failed to delete media")
		}
	}

	const handleMediaSelect = (media: {
		id: Id<"cmsMedia">
		cloudflareId: string
	}) => {
		if (selectionMode && onSelect) {
			onSelect(media)
		}
	}

	return (
		<div className={selectionMode ? "space-y-4" : "space-y-6"}>
			{/* Filters */}
			{!selectionMode && (
				<MediaFilters
					onSearchChange={setSearchTerm}
					onTagsChange={setSelectedTags}
					availableTags={availableTags}
					selectedTags={selectedTags}
				/>
			)}

			{selectionMode && (
				<div className="space-y-3">
					<input
						type="text"
						placeholder="Search by caption or filename..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
					/>
					{availableTags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{availableTags.map((tag) => (
								<button
									key={tag.name}
									type="button"
									onClick={() => {
										setSelectedTags((prev) =>
											prev.includes(tag.name)
												? prev.filter((t) => t !== tag.name)
												: [...prev, tag.name],
										)
									}}
									className={`rounded-full px-3 py-1 text-sm transition-colors ${
										selectedTags.includes(tag.name)
											? "bg-primary text-white"
											: "text-grey-700 bg-grey-100 hover:bg-grey-200"
									}`}
								>
									{tag.name} ({tag.count})
								</button>
							))}
						</div>
					)}
				</div>
			)}

			{/* Gallery Grid */}
			{(hasActiveFilters && filteredMediaItems === undefined) ||
			(!hasActiveFilters && status === "LoadingFirstPage") ? (
				<div className="flex min-h-[300px] items-center justify-center">
					<div className="text-center">
						<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-grey-500">Loading media...</p>
					</div>
				</div>
			) : filteredByType.length === 0 ? (
				<div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-grey-200">
					<div className="text-center text-grey-500">
						<p className="mb-2 font-medium">No media found</p>
						<p className="text-sm">
							{searchTerm || selectedTags.length > 0
								? "Try adjusting your filters"
								: filterType === "files"
									? "Upload your first file to get started"
									: "Upload your first image to get started"}
						</p>
					</div>
				</div>
			) : (
				<div>
					<div className="columns-2 gap-4 md:columns-3 lg:columns-4">
						{filteredByType.map((media) => (
							<MediaCard
								key={media._id}
								id={media._id}
								cloudflareId={media.cloudflareId}
								caption={media.caption}
								tags={media.tags || []}
								width={media.width}
								height={media.height}
								size={media.size}
								mimeType={media.mimeType}
								storageType={media.storageType}
								r2Key={media.r2Key}
								onEdit={() => setEditingMedia(media._id)}
								onReplace={() =>
									setReplacingMedia({
										id: media._id,
										storageType: media.storageType,
										caption: media.caption,
									})
								}
								onDelete={() => handleDelete(media._id)}
								onSelect={() =>
									handleMediaSelect({
										id: media._id,
										cloudflareId: media.cloudflareId,
									})
								}
								isSelected={
									selectionMode && media.cloudflareId === selectedCloudflareId
								}
								selectionMode={selectionMode}
							/>
						))}
					</div>

					<div ref={loadMoreRef} className="h-1 w-full" />

					{!hasActiveFilters && status === "LoadingMore" && (
						<div className="mt-6 flex items-center justify-center">
							<div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					)}

					{!hasActiveFilters &&
						status === "Exhausted" &&
						filteredByType.length > 0 && (
							<p className="mt-6 text-center text-sm text-grey-400">
								You&apos;ve reached the end of the media library
							</p>
						)}
				</div>
			)}

			{/* Edit Media Dialog */}
			{editingMedia && (
				<EditMediaDialog
					mediaId={editingMedia}
					onClose={() => setEditingMedia(null)}
					onSave={async (data) => {
						try {
							await updateMedia({
								id: editingMedia,
								...data,
							})
							toast.success("Media updated successfully")
							setEditingMedia(null)
						} catch (_error) {
							toast.error("Failed to update media")
						}
					}}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			{deletingMedia && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
						<div className="mb-4 flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
								<AlertTriangle className="h-6 w-6 text-error" />
							</div>
							<h3 className="text-lg font-semibold text-primary">
								Delete Media
							</h3>
						</div>

						{checkReferences === undefined ? (
							<p className="mb-6 text-grey-500">Checking references...</p>
						) : checkReferences.isReferenced ? (
							<>
								<p className="mb-4 text-grey-500">
									This media is being used in {checkReferences.referenceCount}{" "}
									content item(s):
								</p>
								<ul className="bg-grey-50 mb-6 max-h-40 space-y-2 overflow-y-auto rounded border border-grey-200 p-3">
									{checkReferences.references.map((ref) => (
										<li key={ref.contentId} className="text-grey-700 text-sm">
											• {ref.schemaName}: {ref.contentTitle}
										</li>
									))}
								</ul>
								<p className="mb-6 text-sm text-error">
									Please remove all references before deleting this media.
								</p>
							</>
						) : (
							<p className="mb-6 text-grey-500">
								Are you sure you want to delete this media? This action cannot
								be undone and will also delete the image from Cloudflare.
							</p>
						)}

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setDeletingMedia(null)}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors hover:bg-grey-100"
							>
								Cancel
							</button>
							{checkReferences && !checkReferences.isReferenced && (
								<button
									type="button"
									onClick={confirmDelete}
									className="rounded-lg bg-error px-4 py-2 text-white transition-colors hover:bg-error/80"
								>
									Delete Media
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Replace Media Dialog */}
			{replacingMedia && (
				<ReplaceMediaDialog
					mediaId={replacingMedia.id}
					storageType={replacingMedia.storageType}
					currentCaption={replacingMedia.caption}
					onClose={() => setReplacingMedia(null)}
					onReplaced={() => setReplacingMedia(null)}
				/>
			)}
		</div>
	)
}

// Edit Media Dialog Component
type EditMediaDialogProps = {
	mediaId: Id<"cmsMedia">
	onClose: () => void
	onSave: (data: {
		caption?: string
		alt?: string
		tags?: string[]
	}) => Promise<void>
}

function EditMediaDialog({ mediaId, onClose, onSave }: EditMediaDialogProps) {
	const media = useQuery(api.cms.media.get, { id: mediaId })
	const [caption, setCaption] = useState("")
	const [alt, setAlt] = useState("")
	const [tagInput, setTagInput] = useState("")
	const [tags, setTags] = useState<string[]>([])
	const [isSaving, setIsSaving] = useState(false)

	// Initialize form when media loads
	useState(() => {
		if (media) {
			setCaption(media.caption)
			setAlt(media.alt || "")
			setTags(media.tags || [])
		}
	})

	const handleAddTag = () => {
		const trimmedTag = tagInput.trim().toLowerCase()
		if (trimmedTag && !tags.includes(trimmedTag)) {
			setTags([...tags, trimmedTag])
			setTagInput("")
		}
	}

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove))
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await onSave({
				caption: caption !== media?.caption ? caption : undefined,
				alt: alt !== media?.alt ? alt : undefined,
				tags:
					JSON.stringify(tags) !== JSON.stringify(media?.tags || [])
						? tags
						: undefined,
			})
		} finally {
			setIsSaving(false)
		}
	}

	if (!media) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
				<div className="rounded-lg bg-white p-8">
					<p className="text-grey-500">Loading...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-2xl rounded-lg bg-white p-6">
				<h3 className="mb-4 text-lg font-semibold text-primary">Edit Media</h3>

				<div className="space-y-4">
					{/* Caption */}
					<div>
						<label
							htmlFor="edit-caption"
							className="mb-2 block text-sm font-medium text-grey-500"
						>
							Caption / Name <span className="text-error">*</span>
						</label>
						<input
							id="edit-caption"
							type="text"
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
						/>
					</div>

					{/* Alt Text */}
					<div>
						<label
							htmlFor="edit-alt"
							className="mb-2 block text-sm font-medium text-grey-500"
						>
							Alt Text
						</label>
						<input
							id="edit-alt"
							type="text"
							value={alt}
							onChange={(e) => setAlt(e.target.value)}
							className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
						/>
					</div>

					{/* Tags */}
					<div>
						<label
							htmlFor="edit-tags"
							className="mb-2 block text-sm font-medium text-grey-500"
						>
							Tags
						</label>
						<div className="flex gap-2">
							<input
								id="edit-tags"
								type="text"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault()
										handleAddTag()
									}
								}}
								placeholder="Add a tag"
								className="flex-1 rounded-lg border border-grey-300 px-4 py-2 text-grey-500 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
							/>
							<button
								type="button"
								onClick={handleAddTag}
								className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-800"
							>
								Add
							</button>
						</div>
						{tags.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2">
								{tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
									>
										{tag}
										<button
											type="button"
											onClick={() => handleRemoveTag(tag)}
											className="hover:text-primary-800"
										>
											×
										</button>
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isSaving}
						className="rounded-lg border border-grey-300 px-4 py-2 text-grey-500 hover:bg-grey-100 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving || !caption.trim()}
						className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50"
					>
						{isSaving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	)
}
