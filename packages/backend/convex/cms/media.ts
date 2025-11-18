import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { authComponent } from "../auth"

// ================================
// QUERIES
// ================================

/**
 * List all media files
 */
export const list = query({
	args: {
		folder: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	returns: v.union(v.array(v.any()), v.null()),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			return null
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			return null
		}

		let query = ctx.db.query("cmsMedia").order("desc")

		if (args.folder) {
			query = ctx.db
				.query("cmsMedia")
				.withIndex("by_folder", (q) => q.eq("folder", args.folder))
				.order("desc")
		}

		if (args.limit) {
			return await query.take(args.limit)
		}

		return await query.collect()
	},
})

/**
 * Get media by ID
 */
export const get = query({
	args: { id: v.id("cmsMedia") },
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			return null
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			return null
		}

		return await ctx.db.get(args.id)
	},
})

/**
 * Get media by Cloudflare ID (public access)
 */
export const getByCloudflareId = query({
	args: { cloudflareId: v.string() },
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsMedia")
			.withIndex("by_cloudflare_id", (q) =>
				q.eq("cloudflareId", args.cloudflareId),
			)
			.unique()
	},
})

/**
 * Get all folders (unique folder names)
 */
export const listFolders = query({
	args: {},
	returns: v.array(v.string()),
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		const allMedia = await ctx.db.query("cmsMedia").collect()
		const folders = new Set<string>()

		for (const media of allMedia) {
			if (media.folder) {
				folders.add(media.folder)
			}
		}

		return Array.from(folders).sort()
	},
})

/**
 * Search media by filename or alt text
 */
export const search = query({
	args: { query: v.string() },
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		const allMedia = await ctx.db.query("cmsMedia").collect()
		const searchLower = args.query.toLowerCase()

		return allMedia.filter((media) => {
			const filenameMatch = media.filename.toLowerCase().includes(searchLower)
			const altMatch = media.alt?.toLowerCase().includes(searchLower)
			const captionMatch = media.caption?.toLowerCase().includes(searchLower)

			return filenameMatch || altMatch || captionMatch
		})
	},
})

// ================================
// MUTATIONS
// ================================

/**
 * Generate upload URL for Convex storage
 */
export const generateUploadUrl = mutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		return await ctx.storage.generateUploadUrl()
	},
})

/**
 * Create media entry after upload
 */
export const create = mutation({
	args: {
		storageId: v.id("_storage"),
		cloudflareId: v.optional(v.string()),
		filename: v.string(),
		mimeType: v.string(),
		size: v.number(),
		width: v.optional(v.number()),
		height: v.optional(v.number()),
		alt: v.optional(v.string()),
		caption: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		folder: v.optional(v.string()),
	},
	returns: v.id("cmsMedia"),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		return await ctx.db.insert("cmsMedia", {
			storageId: args.storageId,
			cloudflareId: args.cloudflareId,
			filename: args.filename,
			mimeType: args.mimeType,
			size: args.size,
			width: args.width,
			height: args.height,
			alt: args.alt,
			caption: args.caption,
			tags: args.tags,
			folder: args.folder,
			uploadedBy: dbUser._id,
			uploadedAt: Date.now(),
		})
	},
})

/**
 * Update media metadata
 */
export const update = mutation({
	args: {
		id: v.id("cmsMedia"),
		cloudflareId: v.optional(v.string()),
		alt: v.optional(v.string()),
		caption: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		folder: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		const media = await ctx.db.get(args.id)
		if (!media) {
			throw new Error("Media not found")
		}

		await ctx.db.patch(args.id, {
			...(args.cloudflareId !== undefined && {
				cloudflareId: args.cloudflareId,
			}),
			...(args.alt !== undefined && { alt: args.alt }),
			...(args.caption !== undefined && { caption: args.caption }),
			...(args.tags !== undefined && { tags: args.tags }),
			...(args.folder !== undefined && { folder: args.folder }),
		})

		return null
	},
})

/**
 * Delete media file
 */
export const remove = mutation({
	args: {
		id: v.id("cmsMedia"),
		deleteFromStorage: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		const media = await ctx.db.get(args.id)
		if (!media) {
			throw new Error("Media not found")
		}

		// Delete from Convex storage if requested
		if (args.deleteFromStorage && media.storageId) {
			await ctx.storage.delete(media.storageId)
		}

		// Delete from database
		await ctx.db.delete(args.id)

		// Note: Cloudflare Images deletion should be handled separately
		// via API call in the frontend or a separate action

		return null
	},
})

/**
 * Bulk delete media files
 */
export const bulkRemove = mutation({
	args: {
		ids: v.array(v.id("cmsMedia")),
		deleteFromStorage: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const dbUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", user._id))
			.unique()

		if (!dbUser || dbUser.role !== "admin") {
			throw new Error("Unauthorized - Admin access required")
		}

		for (const id of args.ids) {
			const media = await ctx.db.get(id)
			if (media) {
				if (args.deleteFromStorage && media.storageId) {
					await ctx.storage.delete(media.storageId)
				}
				await ctx.db.delete(id)
			}
		}

		return null
	},
})
