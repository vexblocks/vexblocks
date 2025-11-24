import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"

/**
 * List all users (admin only)
 */
export const list = query({
	args: {},
	returns: v.union(
		v.array(
			v.object({
				_id: v.id("users"),
				_creationTime: v.number(),
				name: v.optional(v.string()),
				email: v.string(),
				role: v.union(
					v.literal("admin"),
					v.literal("editor"),
					v.literal("developer"),
					v.literal("user"),
				),
				profilePictureUrl: v.optional(v.string()),
			}),
		),
		v.null(),
	),
	handler: async (ctx) => {
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			return null
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!currentUser || currentUser.role !== "admin") {
			return null
		}

		const users = await ctx.db.query("users").collect()
		return users.map((user) => ({
			_id: user._id,
			_creationTime: user._creationTime,
			name: user.name,
			email: user.email,
			role: user.role,
			profilePictureUrl: user.profilePictureUrl,
		}))
	},
})

/**
 * Get user by ID (admin only)
 */
export const get = query({
	args: { id: v.id("users") },
	returns: v.union(
		v.object({
			_id: v.id("users"),
			_creationTime: v.number(),
			name: v.optional(v.string()),
			email: v.string(),
			role: v.union(
				v.literal("admin"),
				v.literal("editor"),
				v.literal("developer"),
				v.literal("user"),
			),
			profilePictureUrl: v.optional(v.string()),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			throw new Error("Not authenticated")
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!currentUser || currentUser.role !== "admin") {
			throw new Error("Unauthorized: Admin access required")
		}

		const user = await ctx.db.get(args.id)
		if (!user) return null

		return {
			_id: user._id,
			_creationTime: user._creationTime,
			name: user.name,
			email: user.email,
			role: user.role,
			profilePictureUrl: user.profilePictureUrl,
		}
	},
})

/**
 * Update user (admin only)
 */
export const update = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		role: v.optional(
			v.union(
				v.literal("admin"),
				v.literal("editor"),
				v.literal("developer"),
				v.literal("user"),
			),
		),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			throw new Error("Not authenticated")
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!currentUser || currentUser.role !== "admin") {
			throw new Error("Unauthorized: Admin access required")
		}

		// Prevent user from demoting themselves if they're the last admin
		if (args.id === currentUser._id && args.role && args.role !== "admin") {
			const allAdmins = await ctx.db
				.query("users")
				.withIndex("by_role", (q) => q.eq("role", "admin"))
				.collect()

			if (allAdmins.length <= 1) {
				throw new Error(
					"Cannot change your own role as the last admin. Promote another user to admin first.",
				)
			}
		}

		const updates: {
			name?: string
			role?: "admin" | "editor" | "developer" | "user"
		} = {}

		if (args.name !== undefined) {
			updates.name = args.name
		}
		if (args.role !== undefined) {
			updates.role = args.role
		}

		await ctx.db.patch(args.id, updates)
		return null
	},
})

/**
 * Delete user (admin only)
 */
export const remove = mutation({
	args: { id: v.id("users") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			throw new Error("Not authenticated")
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!currentUser || currentUser.role !== "admin") {
			throw new Error("Unauthorized: Admin access required")
		}

		// Prevent user from deleting themselves
		if (args.id === currentUser._id) {
			throw new Error("Cannot delete your own account")
		}

		// Check if user to delete is an admin
		const userToDelete = await ctx.db.get(args.id)
		if (userToDelete?.role === "admin") {
			const allAdmins = await ctx.db
				.query("users")
				.withIndex("by_role", (q) => q.eq("role", "admin"))
				.collect()

			if (allAdmins.length <= 1) {
				throw new Error(
					"Cannot delete the last admin user. Promote another user to admin first.",
				)
			}
		}

		await ctx.db.delete(args.id)
		return null
	},
})

/**
 * Get user statistics (admin only)
 */
export const getStats = query({
	args: {},
	returns: v.union(
		v.object({
			total: v.number(),
			admins: v.number(),
			editors: v.number(),
			developers: v.number(),
			users: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			return null
		}

		const currentUser = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!currentUser || currentUser.role !== "admin") {
			return null
		}

		const allUsers = await ctx.db.query("users").collect()
		const stats = {
			total: allUsers.length,
			admins: allUsers.filter((u) => u.role === "admin").length,
			editors: allUsers.filter((u) => u.role === "editor").length,
			developers: allUsers.filter((u) => u.role === "developer").length,
			users: allUsers.filter((u) => u.role === "user").length,
		}

		return stats
	},
})
