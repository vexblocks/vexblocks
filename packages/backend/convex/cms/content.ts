import { ConvexError, v } from "convex/values"
import { internal } from "../_generated/api"
import { internalAction, mutation, query } from "../_generated/server"

import { getAuthenticatedContentUser } from "../utils"

// ================================
// HELPERS
// ================================

/**
 * Helper to resolve localized content
 * For translatable fields (those with locale keys), returns the value for the specified locale
 * with fallback to defaultLocale if not found
 */
function resolveLocalizedContent(
	data: any,
	schemaFields: any[],
	locale?: string,
	defaultLocale?: string,
): any {
	if (!data || typeof data !== "object" || !locale) return data

	const resolved: any = Array.isArray(data) ? [] : {}

	for (const [key, value] of Object.entries(data)) {
		// Find the field definition for this key
		const field = schemaFields.find((f: any) => f.name === key)

		if (
			field?.translatable &&
			value &&
			typeof value === "object" &&
			!Array.isArray(value)
		) {
			// This is a translatable field with locale structure
			const localeValue = value as Record<string, any>
			// Use requested locale, fall back to default, then to first available
			resolved[key] =
				localeValue[locale] ??
				(defaultLocale ? localeValue[defaultLocale] : undefined) ??
				Object.values(localeValue)[0] ??
				null
		} else if (
			(field?.type === "group" || field?.type === "repeater") &&
			field?.fields
		) {
			// Recursively process nested structures
			if (Array.isArray(value)) {
				resolved[key] = value.map((item) =>
					resolveLocalizedContent(item, field.fields, locale, defaultLocale),
				)
			} else {
				resolved[key] = resolveLocalizedContent(
					value,
					field.fields,
					locale,
					defaultLocale,
				)
			}
		} else {
			// Non-translatable field, keep as is
			resolved[key] = value
		}
	}

	return resolved
}

/**
 * Helper to get localization settings from database
 */
async function getLocalizationSettings(ctx: any): Promise<{
	defaultLocale: string | null
	locales: any[]
}> {
	const settings = await ctx.db
		.query("cmsSettings")
		.withIndex("by_key", (q: any) => q.eq("key", "localization"))
		.first()

	if (!settings?.value) {
		return { defaultLocale: null, locales: [] }
	}

	return {
		defaultLocale: settings.value.defaultLocale || null,
		locales: settings.value.locales || [],
	}
}

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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			return null
		}

		return await ctx.db.get(args.id)
	},
})

/**
 * Helper function to normalize flexible blocks structure
 * Transforms {_id, type, data} to {type, value} for consistency with types
 */
function normalizeFlexibleBlocks(data: any): any {
	if (!data || typeof data !== "object") return data

	// If it's an array, process each item
	if (Array.isArray(data)) {
		return data.map((item: any) => {
			// Check if this is a flexible block with {_id, type, data} structure
			if (
				item &&
				typeof item === "object" &&
				"_id" in item &&
				"type" in item &&
				"data" in item
			) {
				// Transform to {type, value} structure
				const { _id, data: blockData, ...rest } = item
				return { ...rest, value: blockData }
			}
			// Recursively process nested objects/arrays
			return normalizeFlexibleBlocks(item)
		})
	}

	// If it's an object, process each property
	const normalized: any = {}
	for (const [key, value] of Object.entries(data)) {
		normalized[key] = normalizeFlexibleBlocks(value)
	}
	return normalized
}

/**
 * Get published content by ID (public access)
 * For use in web apps to fetch referenced content like authors, related posts, etc.
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getPublishedById = query({
	args: {
		id: v.id("cmsContent"),
		locale: v.optional(v.string()),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		const content = await ctx.db.get(args.id)

		// Only return published content
		if (!content || content.status !== "published") {
			return null
		}

		// Get schema for field definitions
		const schema = await ctx.db.get(content.schemaId)

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = normalizeFlexibleBlocks(content.data)

		// Resolve localized content if locale is specified
		if (args.locale && schema?.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
		}
	},
})

/**
 * Get content by slug (for published content - public access)
 * Searches both in root slug field and data.slug field
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getBySlug = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		slug: v.string(),
		locale: v.optional(v.string()),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		// Try to find by root slug field first
		let content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", args.schemaId).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()

		// If not found, search by data.slug
		if (!content) {
			const allContent = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema_and_status", (q) =>
					q.eq("schemaId", args.schemaId).eq("status", "published"),
				)
				.collect()

			content =
				allContent.find((c) => {
					const data = c.data as any
					return data.slug === args.slug
				}) || null
		}

		if (!content) return null

		// Get schema for field definitions
		const schema = await ctx.db.get(content.schemaId)

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = normalizeFlexibleBlocks(content.data)

		// Resolve localized content if locale is specified
		if (args.locale && schema?.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
		}
	},
})

/**
 * Get all published content for a schema (public access)
 * @param locale - Optional locale code to resolve translatable fields
 */
export const listPublished = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		limit: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
		locale: v.optional(v.string()),
	},
	returns: v.array(v.any()),
	handler: async (ctx, args) => {
		const dbQuery = ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", args.schemaId).eq("status", "published"),
			)
			.order("desc")

		const results = args.limit
			? await dbQuery.take(args.limit)
			: await dbQuery.collect()

		// Get schema for field definitions
		const schema = await ctx.db.get(args.schemaId)

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process all results
		const processedResults = results.map((content) => {
			let processedData = normalizeFlexibleBlocks(content.data)

			// Resolve localized content if locale is specified
			if (args.locale && schema?.fields) {
				processedData = resolveLocalizedContent(
					processedData,
					schema.fields,
					args.locale,
					defaultLocale ?? undefined,
				)
			}

			return {
				...content,
				data: processedData,
			}
		})

		// Filter by tags if provided (post-query filtering to handle embedded tag data)
		if (args.tags && args.tags.length > 0) {
			return processedResults.filter((content) => {
				const contentTags = (content.data as any).tags
				if (!contentTags || !Array.isArray(contentTags)) return false

				// Check if any of the specified tag IDs match
				return args.tags!.some((tagId: string) => {
					return contentTags.some((tag: any) => {
						// Handle both ID strings and embedded objects
						if (typeof tag === "string") {
							return tag === tagId
						}
						// Check embedded object _id
						return (tag as any)?._id === tagId
					})
				})
			})
		}

		return processedResults
	},
})

/**
 * Get featured content (first published content with is_featured flag)
 */
export const getFeatured = query({
	args: {
		schemaId: v.id("cmsSchemas"),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		return await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", args.schemaId).eq("status", "published"),
			)
			.filter((q) => {
				const data = q.field("data") as any
				return q.eq(data.is_featured, true)
			})
			.first()
	},
})

/**
 * Get global content by schema name (public access)
 * For use in web apps to fetch global content like headers, footers, etc.
 * Example: await convex.query(api.cms.content.getGlobal, { schemaName: "header", locale: "es" })
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getGlobal = query({
	args: {
		schemaName: v.string(),
		locale: v.optional(v.string()),
	},
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
		const content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", schema._id).eq("status", "published"),
			)
			.unique()

		if (!content) return null

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = content.data

		// Resolve localized content if locale is specified
		if (args.locale && schema.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
		}
	},
})

/**
 * Get page content by schema name and slug (public access)
 * For use in web apps to fetch page content
 * Example: await convex.query(api.cms.content.getPage, { schemaName: "landing_page", slug: "about", locale: "es" })
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getPage = query({
	args: {
		schemaName: v.string(),
		slug: v.string(),
		locale: v.optional(v.string()),
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
		const content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", schema._id).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()

		if (!content) return null

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = content.data

		// Resolve localized content if locale is specified
		if (args.locale && schema.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
		}
	},
})

/**
 * Get collection item by schema name and slug (public access)
 * For use in web apps to fetch collection items (blog posts, products, etc.)
 * Example: await convex.query(api.cms.content.getCollectionItem, { schemaName: "blog_posts", slug: "my-post", locale: "es" })
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getCollectionItem = query({
	args: {
		schemaName: v.string(),
		slug: v.string(),
		locale: v.optional(v.string()),
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
		const content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", schema._id).eq("slug", args.slug),
			)
			.filter((q) => q.eq(q.field("status"), "published"))
			.unique()

		if (!content) return null

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = content.data

		// Resolve localized content if locale is specified
		if (args.locale && schema.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
		}
	},
})

/**
 * List all published items in a collection (public access)
 * For use in web apps to fetch all items in a collection
 * Example: await convex.query(api.cms.content.listCollection, { schemaName: "blog_posts", limit: 10, locale: "es" })
 * @param locale - Optional locale code to resolve translatable fields
 */
export const listCollection = query({
	args: {
		schemaName: v.string(),
		limit: v.optional(v.number()),
		locale: v.optional(v.string()),
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
		const dbQuery = ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_status", (q) =>
				q.eq("schemaId", schema._id).eq("status", "published"),
			)
			.order("desc")

		const results = args.limit
			? await dbQuery.take(args.limit)
			: await dbQuery.collect()

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process all results
		return results.map((content) => {
			let processedData = normalizeFlexibleBlocks(content.data)

			// Resolve localized content if locale is specified
			if (args.locale && schema.fields) {
				processedData = resolveLocalizedContent(
					processedData,
					schema.fields,
					args.locale,
					defaultLocale ?? undefined,
				)
			}

			return {
				...content,
				data: processedData,
			}
		})
	},
})

// ================================
// PREVIEW MODE QUERIES
// ================================

/**
 * Get content by ID for preview mode (includes drafts)
 * Used by the frontend when in preview mode to show draft content
 * This is a public query that allows viewing draft content when the correct preview token is provided
 * @param id - Content ID
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getForPreview = query({
	args: {
		id: v.id("cmsContent"),
		locale: v.optional(v.string()),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		const content = await ctx.db.get(args.id)

		if (!content) {
			return null
		}

		// Get schema for field definitions
		const schema = await ctx.db.get(content.schemaId)

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = normalizeFlexibleBlocks(content.data)

		// Resolve localized content if locale is specified
		if (args.locale && schema?.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
			_isPreview: true,
		}
	},
})

/**
 * Get content by slug for preview mode (includes drafts)
 * Searches both in root slug field and data.slug field
 * @param schemaId - Schema ID
 * @param slug - Content slug
 * @param locale - Optional locale code to resolve translatable fields
 */
export const getBySlugForPreview = query({
	args: {
		schemaId: v.id("cmsSchemas"),
		slug: v.string(),
		locale: v.optional(v.string()),
	},
	returns: v.union(v.any(), v.null()),
	handler: async (ctx, args) => {
		// Try to find by root slug field first (prioritize draft for preview)
		let content = await ctx.db
			.query("cmsContent")
			.withIndex("by_schema_and_slug", (q) =>
				q.eq("schemaId", args.schemaId).eq("slug", args.slug),
			)
			.first()

		// If not found by root slug, search by data.slug
		if (!content) {
			const allContent = await ctx.db
				.query("cmsContent")
				.withIndex("by_schema", (q) => q.eq("schemaId", args.schemaId))
				.collect()

			content =
				allContent.find((c) => {
					const data = c.data as any
					return data.slug === args.slug
				}) || null
		}

		if (!content) return null

		// Get schema for field definitions
		const schema = await ctx.db.get(content.schemaId)

		// Get localization settings for fallback
		const { defaultLocale } = await getLocalizationSettings(ctx)

		// Process data
		let processedData = normalizeFlexibleBlocks(content.data)

		// Resolve localized content if locale is specified
		if (args.locale && schema?.fields) {
			processedData = resolveLocalizedContent(
				processedData,
				schema.fields,
				args.locale,
				defaultLocale ?? undefined,
			)
		}

		return {
			...content,
			data: processedData,
			_isPreview: true,
			_isDraft: content.status === "draft",
		}
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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
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
			createdBy: user._id,
			updatedBy: user._id,
			publishedAt: args.status === "published" ? now : undefined,
			updatedAt: now,
		})

		// Trigger revalidation for both published and draft content
		// This ensures that draft content is also revalidated when saved
		if (args.slug) {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.content.triggerRevalidationAction,
				{
					contentId,
					slug: args.slug,
					schemaName: schema.name,
					urlPattern: schema.previewConfig?.urlPattern,
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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
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
			updatedBy: user._id,
			updatedAt: now,
			...(isPublishing && { publishedAt: now }),
		})

		// Trigger revalidation for both published and draft content
		// This ensures that the cache is updated whenever content is saved
		const finalSlug = args.slug ?? content.slug
		if (finalSlug) {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.content.triggerRevalidationAction,
				{
					contentId: args.id,
					slug: finalSlug,
					schemaName: schema.name,
					urlPattern: schema.previewConfig?.urlPattern,
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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
		}

		const content = await ctx.db.get(args.id)
		if (!content) {
			throw new Error("Content not found")
		}

		// Get schema for revalidation info
		const schema = await ctx.db.get(content.schemaId)

		// Store data needed for revalidation before deleting
		const wasPublished = content.status === "published"
		const contentSlug = content.slug
		const schemaName = schema?.name
		const urlPattern = schema?.previewConfig?.urlPattern

		// Delete the content
		await ctx.db.delete(args.id)

		// Trigger revalidation if content was published (to remove cached page)
		if (wasPublished && schema) {
			await ctx.scheduler.runAfter(
				0,
				internal.cms.content.triggerRevalidationAction,
				{
					contentId: args.id,
					slug: contentSlug,
					schemaName,
					urlPattern,
					isDeleted: true,
				},
			)
		}

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
		const user = await getAuthenticatedContentUser(ctx)
		if (!user) {
			throw new Error("Unauthorized")
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
			createdBy: user._id,
			updatedBy: user._id,
			updatedAt: now,
		})
	},
})

// ================================
// INTERNAL ACTIONS
// ================================

/**
 * Internal action to call the revalidation webhook
 * This is triggered by the scheduler after content is published or deleted
 */
export const triggerRevalidationAction = internalAction({
	args: {
		contentId: v.id("cmsContent"),
		slug: v.optional(v.string()),
		schemaName: v.optional(v.string()),
		urlPattern: v.optional(v.string()),
		isDeleted: v.optional(v.boolean()),
	},
	handler: async (_ctx, args) => {
		// Get the deployment URL (prefer FRONTEND_URL for web app, fallback to SITE_URL)
		const deploymentUrl = process.env.FRONTEND_URL || process.env.SITE_URL
		if (!deploymentUrl) {
			console.warn(
				"FRONTEND_URL or SITE_URL not configured, skipping revalidation",
			)
			return
		}

		// Skip revalidation for localhost URLs (Convex runs in the cloud and can't reach localhost)
		if (
			deploymentUrl.includes("localhost") ||
			deploymentUrl.includes("127.0.0.1")
		) {
			console.log(
				"Skipping revalidation for localhost URL (Convex cannot reach local development servers)",
			)
			return
		}

		const revalidateSecret = process.env.REVALIDATE_SECRET
		if (!revalidateSecret) {
			console.warn("REVALIDATE_SECRET not configured, skipping revalidation")
			return
		}

		try {
			// Call the HTTP webhook
			// Ensure no double slashes and correct API path
			const baseUrl = deploymentUrl.replace(/\/$/, "")
			const requestPayload = {
				contentId: args.contentId,
				slug: args.slug,
				schemaName: args.schemaName,
				urlPattern: args.urlPattern,
				isDeleted: args.isDeleted,
				secret: revalidateSecret,
			}

			console.log(
				`[Revalidation] Triggering for schema: ${args.schemaName}, slug: ${args.slug}, deleted: ${args.isDeleted || false}`,
			)

			const response = await fetch(`${baseUrl}/api/revalidate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestPayload),
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
