import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction, mutation, query } from "../_generated/server"
import { authComponent } from "../auth"

// ================================
// QUERIES
// ================================

/**
 * Get all content for a specific schema
 */
export const listBySchema = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
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

		if (args.status) {
			return await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_status", (q) =>
					q
						.eq("schemaId", args.schemaId)
						.eq("status", args.status as "draft" | "published"),
				)
				.collect()
		}

		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema", (q) => q.eq("schemaId", args.schemaId))
			.collect()
	},
})

/**
 * Get all published content across all schemas (for references)
 */
export const listAll = query({
	args: {},
	returns: v.union(v.array(v.any()), v.null()),
	handler: async (ctx) => {
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

		// Return all published content (most relevant for references)
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_status", (q) => q.eq("status", "published"))
			.collect()
	},
})

/**
 * Get content by ID
 */
export const get = query({
	args: { id: v.id("cmsContent") },
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
 * Get content by slug (for published content - public access)
 */
export const getBySlug = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		slug: v.string(),
	},
	returns: v.union(v.any(), v.null()),
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

/**
 * Get all published content for a schema (public access)
 */
export const listPublished = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		limit: v.optional(v.number()),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		const query = ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", args.schemaId).eq("status", "published"),
			)
			.order("desc")

		if (args.limit) {
			return await query.take(args.limit)
		}

		return await query.collect()
	},
})

/**
 * Get global content by schema name (public access)
 * For use in web apps to fetch global content like headers, footers, etc.
 * Example: await convex.query(api.cms.content.getGlobal, { schemaName: "header" })
 */
export const getGlobal = query({
	args: { schemaName: v.string() },
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		// Get schema by name
		const schema = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.schemaName))
			.unique()

		if (!schema || schema.type !== "global") {
			return null
		}

		// Get the published content (should be only one for global type)
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", schema._id).eq("status", "published"),
			)
			.unique()
	},
})

/**
 * Get page content by schema name and slug (public access)
 * For use in web apps to fetch page content
 * Example: await convex.query(api.cms.content.getPage, { schemaName: "landing_page", slug: "about" })
 */
export const getPage = query({
	args: {
		schemaName: v.string(),
		slug: v.string(),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		// Get schema by name
		const schema = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.schemaName))
			.unique()

		if (!schema || schema.type !== "page") {
			return null
		}

		// Get the published content by slug
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", schema._id).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()
	},
})

/**
 * Get collection item by schema name and slug (public access)
 * For use in web apps to fetch collection items (blog posts, products, etc.)
 * Example: await convex.query(api.cms.content.getCollectionItem, { schemaName: "blog_posts", slug: "my-post" })
 */
export const getCollectionItem = query({
	args: {
		schemaName: v.string(),
		slug: v.string(),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		// Get schema by name
		const schema = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.schemaName))
			.unique()

		if (!schema || schema.type !== "collection") {
			return null
		}

		// Get the published content by slug
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", schema._id).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()
	},
})

/**
 * List all published items in a collection (public access)
 * For use in web apps to fetch all items in a collection
 * Example: await convex.query(api.cms.content.listCollection, { schemaName: "blog_posts", limit: 10 })
 */
export const listCollection = query({
	args: {
		schemaName: v.string(),
		limit: v.optional(v.number()),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		// Get schema by name
		const schema = await ctx.db
			.query("cmsSchemas")
			.withIndex("by_name", (q) => q.eq("name", args.schemaName))
			.unique()

		if (!schema || schema.type !== "collection") {
			return []
		}

		// Get all published content for this collection
		const query = ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", schema._id).eq("status", "published"),
			)
			.order("desc")

		if (args.limit) {
			return await query.take(args.limit)
		}

		return await query.collect()
	},
})

// ================================
// MUTATIONS
// ================================

/**
 * Create new content
 */
export const create = mutation({
	args: {
		schemaId: v.id("cmsSchemas"),
		slug: v.optional(v.string()),
		status: v.union(v.literal("draft"), v.literal("published")),
		data: v.any(),
		seo: v.optional(
			v.object({
				title: v.optional(v.string()),
				description: v.optional(v.string()),
				ogImage: v.optional(v.string()),
			}),
		),
	},
	returns: v.id("cmsContent"),
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

		// Validate schema exists
		const schema = await ctx.db.get(args.schemaId)
		if (!schema) {
			throw new Error("Schema not found")
		}

		// For global type, only allow one PUBLISHED content (multiple drafts are OK)
		if (schema.type === "global" && args.status === "published") {
			const existingPublished = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_status", (q) =>
					q.eq("schemaId", args.schemaId).eq("status", "published"),
				)
				.unique()

			if (existingPublished) {
				throw new ConvexError(
					"A published global content already exists. Please unpublish the existing content first or save this as a draft.",
				)
			}
		}

		// For pages and collections, validate slug is unique
		if (args.slug && (schema.type === "page" || schema.type === "collection")) {
			const existing = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_slug", (q) =>
					q.eq("schemaId", args.schemaId).eq("slug", args.slug),
				)
				.unique()

			if (existing) {
				throw new Error("Content with this slug already exists")
			}
		}

		const now = Date.now()

		const contentId = await ctx.db.insert("cmsContent", {
			schemaId: args.schemaId,
			slug: args.slug,
			status: args.status,
			data: args.data,
			seo: args.seo,
			createdBy: dbUser._id,
			updatedBy: dbUser._id,
			publishedAt: args.status === "published" ? now : undefined,
			updatedAt: now,
		})

		// Trigger revalidation if content is published (schedule action to call webhook)
		if (args.status === "published") {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.content.triggerRevalidationAction,
				{
					contentId,
				},
			)
		}

		return contentId
	},
})

/**
 * Update existing content
 */
export const update = mutation({
	args: {
		id: v.id("cmsContent"),
		slug: v.optional(v.string()),
		status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
		data: v.optional(v.any()),
		seo: v.optional(
			v.object({
				title: v.optional(v.string()),
				description: v.optional(v.string()),
				ogImage: v.optional(v.string()),
			}),
		),
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

		const content = await ctx.db.get(args.id)
		if (!content) {
			throw new Error("Content not found")
		}

		// Get schema to check type
		const schema = await ctx.db.get(content.schemaId)
		if (!schema) {
			throw new Error("Schema not found")
		}

		// For global type, prevent multiple published content
		if (
			schema.type === "global" &&
			args.status === "published" &&
			content.status !== "published"
		) {
			const existingPublished = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_status", (q) =>
					q.eq("schemaId", content.schemaId).eq("status", "published"),
				)
				.unique()

			if (existingPublished) {
				throw new ConvexError(
					"A published global content already exists. Please unpublish the existing content first.",
				)
			}
		}

		// If slug is changing, validate uniqueness
		if (args.slug && args.slug !== content.slug) {
			const existing = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_slug", (q) =>
					q.eq("schemaId", content.schemaId).eq("slug", args.slug),
				)
				.unique()

			if (existing && existing._id !== args.id) {
				throw new Error("Content with this slug already exists")
			}
		}

		const now = Date.now()
		const wasPublished = content.status === "published"
		const isPublishing = args.status === "published" && !wasPublished

		await ctx.db.patch(args.id, {
			...(args.slug !== undefined && { slug: args.slug }),
			...(args.status && { status: args.status }),
			...(args.data && { data: args.data }),
			...(args.seo !== undefined && { seo: args.seo }),
			updatedBy: dbUser._id,
			updatedAt: now,
			...(isPublishing && { publishedAt: now }),
		})

		// Trigger revalidation if content is published (schedule action to call webhook)
		if (args.status === "published" || content.status === "published") {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.content.triggerRevalidationAction,
				{
					contentId: args.id,
				},
			)
		}

		return null
	},
})

/**
 * Delete content
 */
export const remove = mutation({
	args: { id: v.id("cmsContent") },
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

		const content = await ctx.db.get(args.id)
		if (!content) {
			throw new Error("Content not found")
		}

		await ctx.db.delete(args.id)

		return null
	},
})

/**
 * Duplicate content
 */
export const duplicate = mutation({
	args: { id: v.id("cmsContent") },
	returns: v.id("cmsContent"),
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

		const content = await ctx.db.get(args.id)
		if (!content) {
			throw new Error("Content not found")
		}

		const now = Date.now()

		// Generate new slug if exists
		let newSlug = content.slug
		if (newSlug) {
			newSlug = `${newSlug}-copy-${now}`
		}

		return await ctx.db.insert("cmsContent", {
			schemaId: content.schemaId,
			slug: newSlug,
			status: "draft",
			data: content.data,
			seo: content.seo,
			createdBy: dbUser._id,
			updatedBy: dbUser._id,
			updatedAt: now,
		})
	},
})

// ================================
// INTERNAL ACTIONS
// ================================

/**
 * Internal action to call the revalidation webhook
 * This is triggered by the scheduler after content is published
 */
export const triggerRevalidationAction = internalAction({
	args: { contentId: v.id("cmsContent") },
	handler: async (_ctx, args) => {
		// Get the deployment URL
		const deploymentUrl = process.env.CONVEX_SITE_URL
		if (!deploymentUrl) {
			console.warn("CONVEX_SITE_URL not configured, skipping revalidation")
			return
		}

		const revalidateSecret = process.env.REVALIDATE_SECRET
		if (!revalidateSecret) {
			console.warn("REVALIDATE_SECRET not configured, skipping revalidation")
			return
		}

		try {
			// Call the HTTP webhook
			const response = await fetch(`${deploymentUrl}/cms/revalidate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contentId: args.contentId,
					secret: revalidateSecret,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				console.error("Revalidation webhook failed:", errorText)
			} else {
				const result = await response.json()
				console.log("Revalidation webhook succeeded:", result)
			}
		} catch (error) {
			console.error("Error calling revalidation webhook:", error)
		}
	},
})
