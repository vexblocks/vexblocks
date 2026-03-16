import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { getAuthenticatedCMSUser, getAuthenticatedDeveloperUser } from "./utils"

// ================================
// QUERIES
// ================================

/**
 * Get all CMS schemas (public, for type generation)
 * This query is used by the type generator and doesn't require authentication
 */
export const listPublic = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("cmsSchemas"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			type: v.union(v.literal("global"), v.literal("collection")),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			viewConfig: v.optional(
				v.object({
					previewField: v.optional(v.string()),
					additionalFields: v.optional(v.array(v.string())),
				}),
			),
			previewConfig: v.optional(
				v.object({
					urlPattern: v.string(),
					enabled: v.optional(v.boolean()),
				}),
			),
			icon: v.optional(v.string()),
			isSimple: v.optional(v.boolean()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		return await ctx.db.query("cmsSchemas").collect()
	},
})

/**
 * Get all CMS schemas (requires CMS user authentication)
 */
export const list = query({
	args: {},
	returns: v.union(
		v.array(
			v.object({
				_id: v.id("cmsSchemas"),
				_creationTime: v.number(),
				name: v.string(),
				displayName: v.string(),
				type: v.union(v.literal("global"), v.literal("collection")),
				description: v.optional(v.string()),
				fields: v.array(v.any()),
				viewConfig: v.optional(
					v.object({
						previewField: v.optional(v.string()),
						additionalFields: v.optional(v.array(v.string())),
					}),
				),
				previewConfig: v.optional(
					v.object({
						urlPattern: v.string(),
						enabled: v.optional(v.boolean()),
					}),
				),
				icon: v.optional(v.string()),
				isSimple: v.optional(v.boolean()),
				createdBy: v.id("users"),
				updatedAt: v.number(),
			}),
		),
		v.null(),
	),
	handler: async (ctx) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db.query("cmsSchemas").collect()
	},
})

/**
 * Get a single schema by ID
 */
export const get = query({
	args: { id: v.id("cmsSchemas") },
	returns: v.union(
		v.object({
			_id: v.id("cmsSchemas"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			type: v.union(v.literal("global"), v.literal("collection")),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			viewConfig: v.optional(
				v.object({
					previewField: v.optional(v.string()),
					additionalFields: v.optional(v.array(v.string())),
				}),
			),
			previewConfig: v.optional(
				v.object({
					urlPattern: v.string(),
					enabled: v.optional(v.boolean()),
				}),
			),
			icon: v.optional(v.string()),
			isSimple: v.optional(v.boolean()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db.get(args.id)
	},
})

/**
 * Get schema ID by name (public access for web apps)
 */
export const getIdByName = query({
	args: { name: v.string() },
	returns: v.union(v.id("cmsSchemas"), v.null()),
	handler: async (ctx, args) => {
		const schema = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()
		return schema?._id ?? null
	},
})

/**
 * Get schema by name
 */
export const getByName = query({
	args: { name: v.string() },
	returns: v.union(
		v.object({
			_id: v.id("cmsSchemas"),
			_creationTime: v.number(),
			name: v.string(),
			displayName: v.string(),
			type: v.union(v.literal("global"), v.literal("collection")),
			description: v.optional(v.string()),
			fields: v.array(v.any()),
			viewConfig: v.optional(
				v.object({
					previewField: v.optional(v.string()),
					additionalFields: v.optional(v.array(v.string())),
				}),
			),
			previewConfig: v.optional(
				v.object({
					urlPattern: v.string(),
					enabled: v.optional(v.boolean()),
				}),
			),
			icon: v.optional(v.string()),
			isSimple: v.optional(v.boolean()),
			createdBy: v.id("users"),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()
	},
})

/**
 * Get schemas by type
 */
export const listByType = query({
	args: {
		type: v.union(v.literal("global"), v.literal("collection")),
	},
	returns: v.union(v.array(v.any()), v.null()),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db
			.query("cmsSchemas")
			.withIndex("by_type", (q) => q.eq("type", args.type))
			.collect()
	},
})

// ================================
// MUTATIONS
// ================================

/**
 * Create a new schema
 */
export const create = mutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		type: v.union(v.literal("global"), v.literal("collection")),
		description: v.optional(v.string()),
		fields: v.array(v.any()),
		icon: v.optional(v.string()),
		isSimple: v.optional(v.boolean()),
		previewConfig: v.optional(
			v.object({
				urlPattern: v.string(),
				enabled: v.optional(v.boolean()),
			}),
		),
	},
	returns: v.id("cmsSchemas"),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		// Check if schema with this name already exists
		const existing = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()

		if (existing) {
			throw new Error(`Schema with name "${args.name}" already exists`)
		}

		// Validate fields
		if (args.fields.length === 0) {
			throw new Error("Schema must have at least one field")
		}

		return await ctx.db.insert("cmsSchemas", {
			name: args.name,
			displayName: args.displayName,
			type: args.type,
			description: args.description,
			fields: args.fields,
			icon: args.icon,
			isSimple: args.isSimple,
			previewConfig: args.previewConfig,
			createdBy: user._id,
			updatedAt: Date.now(),
		})
	},
})

/**
 * Update an existing schema
 */
export const update = mutation({
	args: {
		id: v.id("cmsSchemas"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		fields: v.optional(v.array(v.any())),
		viewConfig: v.optional(
			v.object({
				previewField: v.optional(v.string()),
				additionalFields: v.optional(v.array(v.string())),
			}),
		),
		previewConfig: v.optional(
			v.object({
				urlPattern: v.string(),
				enabled: v.optional(v.boolean()),
			}),
		),
		icon: v.optional(v.string()),
		isSimple: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const schema = await ctx.db.get(args.id)
		if (!schema) {
			throw new Error("Schema not found")
		}

		await ctx.db.patch(args.id, {
			...(args.displayName && { displayName: args.displayName }),
			...(args.description !== undefined && { description: args.description }),
			...(args.fields && { fields: args.fields }),
			...(args.viewConfig !== undefined && { viewConfig: args.viewConfig }),
			...(args.previewConfig !== undefined && {
				previewConfig: args.previewConfig,
			}),
			...(args.icon !== undefined && { icon: args.icon }),
			...(args.isSimple !== undefined && { isSimple: args.isSimple }),
			updatedAt: Date.now(),
		})

		return null
	},
})

/**
 * Delete a schema and all its content
 */
export const remove = mutation({
	args: { id: v.id("cmsSchemas") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedDeveloperUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const schema = await ctx.db.get(args.id)
		if (!schema) {
			throw new Error("Schema not found")
		}

		// Delete all content associated with this schema
		const content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema", (q) => q.eq("schemaId", args.id))
			.collect()

		for (const item of content) {
			await ctx.db.delete(item._id)
		}

		// Delete the schema
		await ctx.db.delete(args.id)

		return null
	},
})
