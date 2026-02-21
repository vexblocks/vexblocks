import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { internalMutation, mutation, query } from "../_generated/server"
import { r2 } from "./r2"
import { getAuthenticatedContentUser } from "./utils"

// Shared validator for media item return types
const mediaItemValidator = v.object({
	_id: v.id("cmsMedia"),
	_creationTime: v.number(),
	cloudflareId: v.string(),
	filename: v.string(),
	mimeType: v.string(),
	size: v.number(),
	width: v.optional(v.number()),
	height: v.optional(v.number()),
	caption: v.string(),
	alt: v.optional(v.string()),
	tags: v.optional(v.array(v.string())),
	storageType: v.optional(v.string()),
	r2Key: v.optional(v.string()),
	uploadedBy: v.id("users"),
	uploadedAt: v.number(),
})

/**
 * List all media with optional filters
 */
export const list = query({
	args: {
		search: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	returns: v.array(mediaItemValidator),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		let mediaItems = await ctx.db.query("cmsMedia").order("desc").collect()

		// Filter by search term (caption or filename)
		if (args.search) {
			const searchLower = args.search.toLowerCase()
			mediaItems = mediaItems.filter(
				(item) =>
					item.caption.toLowerCase().includes(searchLower) ||
					item.filename.toLowerCase().includes(searchLower),
			)
		}

		// Filter by tags (media must have ALL specified tags)
		if (args.tags && args.tags.length > 0) {
			mediaItems = mediaItems.filter((item) =>
				args.tags!.every((tag) => (item.tags || []).includes(tag)),
			)
		}

		return mediaItems
	},
})

/**
 * Get a single media item by ID
 */
export const get = query({
	args: {
		id: v.id("cmsMedia"),
	},
	returns: v.union(mediaItemValidator, v.null()),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		return await ctx.db.get(args.id)
	},
})

/**
 * Get a single media item by ID (Public access)
 */
export const getPublic = query({
	args: {
		id: v.id("cmsMedia"),
	},
	returns: v.union(mediaItemValidator, v.null()),
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id)
	},
})

/**
 * Get media by Cloudflare ID
 */
export const getByCloudflareId = query({
	args: {
		cloudflareId: v.string(),
	},
	returns: v.union(mediaItemValidator, v.null()),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		return await ctx.db
			.query("cmsMedia")
			.withIndex("by_cloudflare_id", (q) =>
				q.eq("cloudflareId", args.cloudflareId),
			)
			.first()
	},
})

/**
 * Create a new media entry after uploading to Cloudflare Images or R2
 */
export const create = mutation({
	args: {
		cloudflareId: v.string(),
		filename: v.string(),
		mimeType: v.string(),
		size: v.number(),
		width: v.optional(v.number()),
		height: v.optional(v.number()),
		caption: v.string(),
		alt: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		storageType: v.optional(v.string()),
		r2Key: v.optional(v.string()),
	},
	returns: v.id("cmsMedia"),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		// Normalize tags
		const normalizedTags = args.tags
			? args.tags.map((tag) => tag.toLowerCase().trim())
			: []

		// Update tag usage counts
		for (const tag of normalizedTags) {
			await ctx.scheduler.runAfter(0, internal.cms.media.updateTagUsage, {
				tagName: tag,
				increment: true,
			})
		}

		const mediaId = await ctx.db.insert("cmsMedia", {
			cloudflareId: args.cloudflareId,
			filename: args.filename,
			mimeType: args.mimeType,
			size: args.size,
			width: args.width,
			height: args.height,
			caption: args.caption,
			alt: args.alt,
			tags: normalizedTags.length > 0 ? normalizedTags : undefined,
			storageType: args.storageType,
			r2Key: args.r2Key,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		})

		return mediaId
	},
})

/**
 * Update media metadata (caption, alt, tags)
 */
export const update = mutation({
	args: {
		id: v.id("cmsMedia"),
		caption: v.optional(v.string()),
		alt: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const media = await ctx.db.get(args.id)
		if (!media) {
			throw new ConvexError("Media not found")
		}

		const updates: any = {}

		if (args.caption !== undefined) {
			updates.caption = args.caption
		}

		if (args.alt !== undefined) {
			updates.alt = args.alt
		}

		// Handle tag updates (increment/decrement usage counts)
		if (args.tags !== undefined) {
			const normalizedNewTags = args.tags.map((tag) => tag.toLowerCase().trim())
			const oldTags = media.tags || []

			// Find added and removed tags
			const addedTags = normalizedNewTags.filter(
				(tag) => !oldTags.includes(tag),
			)
			const removedTags = oldTags.filter(
				(tag) => !normalizedNewTags.includes(tag),
			)

			// Update usage counts
			for (const tag of addedTags) {
				await ctx.scheduler.runAfter(0, internal.cms.media.updateTagUsage, {
					tagName: tag,
					increment: true,
				})
			}

			for (const tag of removedTags) {
				await ctx.scheduler.runAfter(0, internal.cms.media.updateTagUsage, {
					tagName: tag,
					increment: false,
				})
			}

			updates.tags = normalizedNewTags
		}

		await ctx.db.patch(args.id, updates)
		return null
	},
})

/**
 * Check if media is referenced in any content
 */
export const checkReferences = query({
	args: {
		mediaId: v.id("cmsMedia"),
	},
	returns: v.object({
		isReferenced: v.boolean(),
		referenceCount: v.number(),
		references: v.array(
			v.object({
				contentId: v.id("cmsContent"),
				schemaName: v.string(),
				contentTitle: v.string(),
			}),
		),
	}),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const media = await ctx.db.get(args.mediaId)
		if (!media) {
			return { isReferenced: false, referenceCount: 0, references: [] }
		}

		// For R2 files, content stores String(media._id); for images, content stores cloudflareId
		const valueToCheck =
			media.storageType === "r2" ? args.mediaId : media.cloudflareId

		const allContent = await ctx.db.query("cmsContent").collect()
		const references: Array<{
			contentId: any
			schemaName: string
			contentTitle: string
		}> = []

		function searchInObject(obj: any): boolean {
			if (!obj || typeof obj !== "object") return false

			for (const value of Object.values(obj)) {
				if (value === valueToCheck) {
					return true
				}
				if (Array.isArray(value)) {
					for (const item of value) {
						if (searchInObject(item)) return true
					}
				} else if (typeof value === "object") {
					if (searchInObject(value)) return true
				}
			}
			return false
		}

		for (const content of allContent) {
			if (searchInObject(content.data)) {
				const schema = await ctx.db.get(content.schemaId)
				references.push({
					contentId: content._id,
					schemaName: schema?.displayName || "Unknown",
					contentTitle:
						content.data?.title ||
						content.data?.name ||
						content.slug ||
						"Untitled",
				})
			}
		}

		return {
			isReferenced: references.length > 0,
			referenceCount: references.length,
			references,
		}
	},
})

/**
 * Delete media (only if not referenced)
 */
export const remove = mutation({
	args: {
		id: v.id("cmsMedia"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const media = await ctx.db.get(args.id)
		if (!media) {
			throw new ConvexError("Media not found")
		}

		// Check if media is referenced in any content
		const allContent = await ctx.db.query("cmsContent").collect()
		// For R2 files, content stores String(media._id); for images, content stores cloudflareId
		const valueToCheck =
			media.storageType === "r2" ? args.id : media.cloudflareId

		function searchInObject(obj: any): boolean {
			if (!obj || typeof obj !== "object") return false

			for (const value of Object.values(obj)) {
				if (value === valueToCheck) {
					return true
				}
				if (Array.isArray(value)) {
					for (const item of value) {
						if (searchInObject(item)) return true
					}
				} else if (typeof value === "object") {
					if (searchInObject(value)) return true
				}
			}
			return false
		}

		for (const content of allContent) {
			if (searchInObject(content.data)) {
				throw new ConvexError(
					"Cannot delete media: it is being used in content. Please remove all references first.",
				)
			}
		}

		// Decrement tag usage counts
		for (const tag of media.tags || []) {
			await ctx.scheduler.runAfter(0, internal.cms.media.updateTagUsage, {
				tagName: tag,
				increment: false,
			})
		}

		// Delete from storage
		if (media.storageType === "r2" && media.r2Key) {
			// Delete from R2 using the component
			await r2.deleteObject(ctx, media.r2Key)
		} else {
			// Delete from Cloudflare Images
			await ctx.scheduler.runAfter(
				0,
				internal.cms.mediaActions.deleteFromCloudflare,
				{
					cloudflareId: media.cloudflareId,
				},
			)
		}

		// Delete from Convex
		await ctx.db.delete(args.id)

		return null
	},
})

/**
 * Replace media file: upload the new asset first (client-side), then call this
 * mutation to delete the old file from Cloudflare/R2 and update the DB record.
 * For Cloudflare Images, all content references are updated automatically.
 */
export const replace = mutation({
	args: {
		id: v.id("cmsMedia"),
		filename: v.string(),
		mimeType: v.string(),
		size: v.number(),
		width: v.optional(v.number()),
		height: v.optional(v.number()),
		// Provide for Cloudflare Images replacement
		cloudflareId: v.optional(v.string()),
		// Provide for R2 replacement
		r2Key: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const media = await ctx.db.get(args.id)
		if (!media) {
			throw new ConvexError("Media not found")
		}

		const isR2 = media.storageType === "r2"

		// For Cloudflare Images: update all content references from old cloudflareId
		// to the new one so existing content doesn't break.
		if (
			!isR2 &&
			args.cloudflareId &&
			media.cloudflareId &&
			args.cloudflareId !== media.cloudflareId
		) {
			const oldId = media.cloudflareId
			const newId = args.cloudflareId

			function replaceValueInObject(obj: any): any {
				if (obj === oldId) return newId
				if (!obj || typeof obj !== "object") return obj
				if (Array.isArray(obj)) return obj.map(replaceValueInObject)
				const result: Record<string, any> = {}
				for (const [key, value] of Object.entries(obj)) {
					result[key] = replaceValueInObject(value)
				}
				return result
			}

			const allContent = await ctx.db.query("cmsContent").collect()
			for (const content of allContent) {
				if (content.data) {
					const updatedData = replaceValueInObject(content.data)
					if (JSON.stringify(updatedData) !== JSON.stringify(content.data)) {
						await ctx.db.patch(content._id, { data: updatedData })
					}
				}
			}
		}

		// Delete old file from storage
		if (isR2 && media.r2Key) {
			await r2.deleteObject(ctx, media.r2Key)
		} else if (!isR2 && media.cloudflareId) {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.mediaActions.deleteFromCloudflare,
				{ cloudflareId: media.cloudflareId },
			)
		}

		// Update the DB record with new file metadata
		const updates: any = {
			filename: args.filename,
			mimeType: args.mimeType,
			size: args.size,
		}

		if (isR2 && args.r2Key) {
			updates.r2Key = args.r2Key
		} else if (!isR2 && args.cloudflareId) {
			updates.cloudflareId = args.cloudflareId
		}

		if (args.width !== undefined) updates.width = args.width
		if (args.height !== undefined) updates.height = args.height

		await ctx.db.patch(args.id, updates)
		return null
	},
})

/**
 * Internal mutation to update tag usage count
 */
export const updateTagUsage = internalMutation({
	args: {
		tagName: v.string(),
		increment: v.boolean(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const tag = await ctx.db
			.query("cmsMediaTags")
			.withIndex("by_name", (q) => q.eq("name", args.tagName))
			.first()

		if (tag) {
			const newCount = args.increment
				? tag.usageCount + 1
				: Math.max(0, tag.usageCount - 1)

			await ctx.db.patch(tag._id, {
				usageCount: newCount,
			})
		} else if (args.increment) {
			// Create tag if it doesn't exist and we're incrementing
			const admin = await ctx.auth.getUserIdentity()
			if (admin) {
				const user = await ctx.db
					.query("users")
					.withIndex("authId", (q) => q.eq("authId", admin.subject))
					.first()

				if (user) {
					await ctx.db.insert("cmsMediaTags", {
						name: args.tagName,
						usageCount: 1,
						createdBy: user._id,
						createdAt: Date.now(),
					})
				}
			}
		}

		return null
	},
})
