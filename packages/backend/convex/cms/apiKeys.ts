import { ConvexError, v } from "convex/values"
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "../_generated/server"
import { getAuthenticatedAdminUser } from "./utils"

// =============================================================================
// HELPERS
// =============================================================================

async function hashKey(rawKey: string): Promise<string> {
	const encoder = new TextEncoder()
	const data = encoder.encode(rawKey)
	const hashBuffer = await crypto.subtle.digest("SHA-256", data)
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
}

function generateRawKey(): string {
	const bytes = new Uint8Array(24)
	crypto.getRandomValues(bytes)
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
	return `cb_${hex}`
}

// =============================================================================
// QUERIES
// =============================================================================

export const list = query({
	args: {},
	returns: v.union(
		v.array(
			v.object({
				_id: v.id("cmsApiKeys"),
				_creationTime: v.number(),
				name: v.string(),
				keyPrefix: v.string(),
				createdBy: v.id("users"),
				createdAt: v.number(),
				lastUsedAt: v.optional(v.number()),
				revokedAt: v.optional(v.number()),
			}),
		),
		v.null(),
	),
	handler: async (ctx) => {
		const user = await getAuthenticatedAdminUser(ctx)
		if (!user) return null

		const keys = await ctx.db.query("cmsApiKeys").collect()
		return keys.map((k) => ({
			_id: k._id,
			_creationTime: k._creationTime,
			name: k.name,
			keyPrefix: k.keyPrefix,
			createdBy: k.createdBy,
			createdAt: k.createdAt,
			lastUsedAt: k.lastUsedAt,
			revokedAt: k.revokedAt,
		}))
	},
})

// =============================================================================
// MUTATIONS
// =============================================================================

export const create = mutation({
	args: {
		name: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("cmsApiKeys"),
			rawKey: v.string(), // Returned only once!
			keyPrefix: v.string(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedAdminUser(ctx)
		if (!user) return null

		if (!args.name.trim()) {
			throw new ConvexError("API key name is required")
		}

		const rawKey = generateRawKey()
		const keyHash = await hashKey(rawKey)
		const keyPrefix = rawKey.slice(0, 16) + "..."

		const id = await ctx.db.insert("cmsApiKeys", {
			name: args.name.trim(),
			keyHash,
			keyPrefix,
			createdBy: user._id,
			createdAt: Date.now(),
		})

		return { _id: id, rawKey, keyPrefix }
	},
})

export const revoke = mutation({
	args: {
		id: v.id("cmsApiKeys"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedAdminUser(ctx)
		if (!user) throw new ConvexError("Unauthorized")

		const apiKey = await ctx.db.get(args.id)
		if (!apiKey) throw new ConvexError("API key not found")
		if (apiKey.revokedAt) throw new ConvexError("API key already revoked")

		await ctx.db.patch(args.id, { revokedAt: Date.now() })
		return null
	},
})

export const remove = mutation({
	args: {
		id: v.id("cmsApiKeys"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getAuthenticatedAdminUser(ctx)
		if (!user) throw new ConvexError("Unauthorized")

		await ctx.db.delete(args.id)
		return null
	},
})

// =============================================================================
// INTERNAL (used by HTTP actions)
// =============================================================================

export const validateAndTouch = internalQuery({
	args: {
		keyHash: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("cmsApiKeys"),
			name: v.string(),
			revokedAt: v.optional(v.number()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const apiKey = await ctx.db
			.query("cmsApiKeys")
			.withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
			.unique()

		if (!apiKey) return null
		return {
			_id: apiKey._id,
			name: apiKey.name,
			revokedAt: apiKey.revokedAt,
		}
	},
})

export const touchLastUsed = internalMutation({
	args: {
		id: v.id("cmsApiKeys"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { lastUsedAt: Date.now() })
		return null
	},
})
