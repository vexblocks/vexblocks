import { v } from "convex/values"
import { internalQuery } from "../_generated/server"

/**
 * Internal query to get content data for revalidation
 */
export const getContentForRevalidation = internalQuery({
	args: { contentId: v.id("cmsContent") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.contentId)
	},
})

/**
 * Internal query to get schema data for revalidation
 */
export const getSchemaForRevalidation = internalQuery({
	args: { schemaId: v.id("cmsSchemas") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.schemaId)
	},
})
