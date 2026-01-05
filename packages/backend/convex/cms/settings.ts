import { v } from "convex/values"
import { mutation, query } from "../_generated/server"

// Get settings by key
export const get = query({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const settings = await ctx.db
			.query("cmsSettings")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first()

		return settings?.value || null
	},
})

// Update settings
export const update = mutation({
	args: {
		key: v.string(),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthenticated")
		}

		// Find user
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", identity.subject))
			.first()

		if (!user) {
			throw new Error("User not found")
		}

		// Check if settings exist
		const existingSettings = await ctx.db
			.query("cmsSettings")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first()

		const now = Date.now()

		if (existingSettings) {
			await ctx.db.patch(existingSettings._id, {
				value: args.value,
				updatedBy: user._id,
				updatedAt: now,
			})
		} else {
			await ctx.db.insert("cmsSettings", {
				key: args.key,
				value: args.value,
				updatedBy: user._id,
				updatedAt: now,
			})
		}

		return true
	},
})

// Public query to get settings without authentication (for login page)
export const getPublic = query({
	args: {
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const settings = await ctx.db
			.query("cmsSettings")
			.withIndex("by_key", (q) => q.eq("key", args.key))
			.first()

		return settings?.value || null
	},
})
