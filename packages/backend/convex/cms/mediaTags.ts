import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { getAuthenticatedContentUser } from "../utils"

/**
 * List all media tags
 */
export const list = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("cmsMediaTags"),
			_creationTime: v.number(),
			name: v.string(),
			color: v.optional(v.string()),
			usageCount: v.number(),
			createdBy: v.id("users"),
			createdAt: v.number(),
		}),
	),
	handler: async (ctx, _args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const tags = await ctx.db.query("cmsMediaTags").order("desc").collect()

		return tags
	},
})

/**
 * Get popular tags (sorted by usage count)
 */
export const listPopular = query({
	args: { limit: v.optional(v.number()) },
	returns: v.array(
		v.object({
			_id: v.id("cmsMediaTags"),
			_creationTime: v.number(),
			name: v.string(),
			color: v.optional(v.string()),
			usageCount: v.number(),
			createdBy: v.id("users"),
			createdAt: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const tags = await ctx.db
			.query("cmsMediaTags")
			.withIndex("by_usage_count")
			.order("desc")
			.take(args.limit || 20)

		return tags
	},
})

/**
 * Create or update a tag
 * If tag name exists, returns existing tag
 * If not, creates a new one
 */
export const upsert = mutation({
	args: {
		name: v.string(),
		color: v.optional(v.string()),
	},
	returns: v.id("cmsMediaTags"),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		// Normalize tag name (lowercase, trim)
		const normalizedName = args.name.toLowerCase().trim()

		if (!normalizedName) {
			throw new ConvexError("Tag name cannot be empty")
		}

		// Check if tag already exists
		const existingTag = await ctx.db
			.query("cmsMediaTags")
			.withIndex("by_name", (q) => q.eq("name", normalizedName))
			.first()

		if (existingTag) {
			// Update color if provided
			if (args.color) {
				await ctx.db.patch(existingTag._id, {
					color: args.color,
				})
			}
			return existingTag._id
		}

		// Create new tag
		const tagId = await ctx.db.insert("cmsMediaTags", {
			name: normalizedName,
			color: args.color,
			usageCount: 0,
			createdBy: user._id,
			createdAt: Date.now(),
		})

		return tagId
	},
})

/**
 * Update a tag
 */
export const update = mutation({
	args: {
		id: v.id("cmsMediaTags"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const tag = await ctx.db.get(args.id)
		if (!tag) {
			throw new ConvexError("Tag not found")
		}

		const updates: any = {}

		if (args.name !== undefined) {
			const normalizedName = args.name.toLowerCase().trim()
			if (!normalizedName) {
				throw new ConvexError("Tag name cannot be empty")
			}

			// Check if new name conflicts with existing tag
			const existingTag = await ctx.db
				.query("cmsMediaTags")
				.withIndex("by_name", (q) => q.eq("name", normalizedName))
				.first()

			if (existingTag && existingTag._id !== args.id) {
				throw new ConvexError("A tag with this name already exists")
			}

			updates.name = normalizedName
		}

		if (args.color !== undefined) {
			updates.color = args.color
		}

		await ctx.db.patch(args.id, updates)
		return null
	},
})

/**
 * Delete a tag
 * Only allows deletion if no media items are using it
 */
export const remove = mutation({
	args: {
		id: v.id("cmsMediaTags"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const tag = await ctx.db.get(args.id)
		if (!tag) {
			throw new ConvexError("Tag not found")
		}

		// Check if tag is being used
		if (tag.usageCount > 0) {
			throw new ConvexError(
				`Cannot delete tag "${tag.name}" because it is being used by ${tag.usageCount} media item(s)`,
			)
		}

		await ctx.db.delete(args.id)
		return null
	},
})

/**
 * Increment usage count for a tag
 */
export const incrementUsage = mutation({
	args: {
		tagName: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const normalizedName = args.tagName.toLowerCase().trim()

		const tag = await ctx.db
			.query("cmsMediaTags")
			.withIndex("by_name", (q) => q.eq("name", normalizedName))
			.first()

		if (tag) {
			await ctx.db.patch(tag._id, {
				usageCount: tag.usageCount + 1,
			})
		}

		return null
	},
})

/**
 * Decrement usage count for a tag
 */
export const decrementUsage = mutation({
	args: {
		tagName: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const normalizedName = args.tagName.toLowerCase().trim()

		const tag = await ctx.db
			.query("cmsMediaTags")
			.withIndex("by_name", (q) => q.eq("name", normalizedName))
			.first()

		if (tag && tag.usageCount > 0) {
			await ctx.db.patch(tag._id, {
				usageCount: tag.usageCount - 1,
			})
		}

		return null
	},
})
