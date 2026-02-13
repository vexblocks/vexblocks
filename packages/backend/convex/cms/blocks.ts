import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { getAuthenticatedDeveloperUser } from "./utils"

// ================================
// QUERIES
// ================================

/**
 * Get all reusable blocks (public, for type generation)
 * This query is used by the type generator and doesn't require authentication
 */
export const listPublic = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("cmsBlocks"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			icon: v.optional(v.string()),
			previewImage: v.optional(v.string()),
			category: v.optional(v.string()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		return await ctx.db.query("cmsBlocks").collect()
	},
})

/**
 * Get all reusable blocks
 */
export const list = query({
	args: {},
	returns: v.union(
		v.array(
			v.object({
				_id: v.id("cmsBlocks"),
				_creationTime: v.number(),
				name: v.string(),
				displayName: v.string(),
				description: v.optional(v.string()),
				fields: v.array(v.any()),
				icon: v.optional(v.string()),
				previewImage: v.optional(v.string()),
				category: v.optional(v.string()),
				createdBy: v.id("users"),
				updatedAt: v.number(),
			}),
		),
		v.null(),
	),
	handler: async (ctx) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db.query("cmsBlocks").collect()
	},
})

/**
 * Get a single block by ID
 */
export const get = query({
	args: { id: v.id("cmsBlocks") },
	returns: v.union(
		v.object({
			_id: v.id("cmsBlocks"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			icon: v.optional(v.string()),
			previewImage: v.optional(v.string()),
			category: v.optional(v.string()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db.get(args.id)
	},
})

/**
 * Get block by name
 */
export const getByName = query({
	args: { name: v.string() },
	returns: v.union(
		v.object({
			_id: v.id("cmsBlocks"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			icon: v.optional(v.string()),
			previewImage: v.optional(v.string()),
			category: v.optional(v.string()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsBlocks")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()
	},
})

/**
 * Get blocks by category
 */
export const listByCategory = query({
	args: { category: v.string() },
	returns: v.union(v.array(v.any()), v.null()),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db
			.query("cmsBlocks")
			.withIndex("by_category", (q) => q.eq("category", args.category))
			.collect()
	},
})

// ================================
// MUTATIONS
// ================================

/**
 * Create a new reusable block
 */
export const create = mutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		fields: v.array(v.any()),
		icon: v.optional(v.string()),
		previewImage: v.optional(v.string()),
		category: v.optional(v.string()),
	},
	returns: v.id("cmsBlocks"),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		// Check if block with this name already exists
		const existing = await ctx.db
			.query("cmsBlocks")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()

		if (existing) {
			throw new Error(`Block with name "${args.name}" already exists`)
		}

		// Validate fields
		if (args.fields.length === 0) {
			throw new Error("Block must have at least one field")
		}

		return await ctx.db.insert("cmsBlocks", {
			name: args.name,
			displayName: args.displayName,
			description: args.description,
			fields: args.fields,
			icon: args.icon,
			previewImage: args.previewImage,
			category: args.category,
			createdBy: user._id,
			updatedAt: Date.now(),
		})
	},
})

/**
 * Update an existing block
 */
export const update = mutation({
	args: {
		id: v.id("cmsBlocks"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		fields: v.optional(v.array(v.any())),
		icon: v.optional(v.string()),
		previewImage: v.optional(v.string()),
		category: v.optional(v.string()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const block = await ctx.db.get(args.id)
		if (!block) {
			throw new Error("Block not found")
		}

		await ctx.db.patch(args.id, {
			...(args.displayName && { displayName: args.displayName }),
			...(args.description !== undefined && { description: args.description }),
			...(args.fields && { fields: args.fields }),
			...(args.icon !== undefined && { icon: args.icon }),
			...(args.previewImage !== undefined && {
				previewImage: args.previewImage,
			}),
			...(args.category !== undefined && { category: args.category }),
			updatedAt: Date.now(),
		})

		return null
	},
})

/**
 * Delete a block
 */
export const remove = mutation({
	args: { id: v.id("cmsBlocks") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const block = await ctx.db.get(args.id)
		if (!block) {
			throw new Error("Block not found")
		}

		// Note: We don't delete content that references this block
		// The content will still have the data, but won't be able to edit the block structure

		// Delete the block
		await ctx.db.delete(args.id)

		return null
	},
})
