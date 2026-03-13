import { v } from "convex/values"
import { internalQuery } from "../_generated/server"

/**
 * Internal query to get a schema by its name identifier (for REST API)
 */
export const getSchemaByName = internalQuery({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.unique()
	},
})

/**
 * Internal query to list published content entries for a schema (for REST API)
 */
export const listPublishedContent = internalQuery({
	args: {
		schemaId: v.id("cmsSchemas"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = Math.min(args.limit ?? 100, 500)
		const items = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", args.schemaId).eq("status", "published"),
			)
			.take(limit)
		return items
	},
})

/**
 * Internal query to get a single published content entry by id (for REST API)
 */
export const getPublishedContent = internalQuery({
	args: {
		id: v.id("cmsContent"),
		schemaId: v.id("cmsSchemas"),
	},
	handler: async (ctx, args) => {
		const content = await ctx.db.get(args.id)
		if (!content) return null
		if (content.schemaId !== args.schemaId) return null
		if (content.status !== "published") return null
		return content
	},
})

/**
 * Internal query to get a single published content entry by slug (for REST API)
 */
export const getPublishedContentBySlug = internalQuery({
	args: {
		slug: v.string(),
		schemaId: v.id("cmsSchemas"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", args.schemaId).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()
	},
})
