import { ConvexError } from "convex/values"
import type { QueryCtx } from "../_generated/server"
import { authComponent } from "../auth"

export const getAuthenticatedUser = async (ctx: QueryCtx) => {
	const authUser = await authComponent.safeGetAuthUser(ctx)
	if (!authUser) {
		return null
	}

	const user = await ctx.db
		.query("users")
		.withIndex("authId", (q) => q.eq("authId", authUser._id))
		.unique()

	if (!user) {
		throw new ConvexError("User not found")
	}

	// Check if user is active
	if (user.isActive === false) {
		throw new ConvexError("Account disabled. Please contact an administrator.")
	}

	// Spread authUser first, then user - this ensures user._id (Id<"users">)
	// takes precedence over authUser._id (Id<"user">)
	return { ...authUser, ...user }
}

export const getAuthenticatedAdminUser = async (ctx: QueryCtx) => {
	const user = await getAuthenticatedUser(ctx)

	if (!user) {
		return null
	}

	if (user.role !== "admin") {
		throw new ConvexError("Unauthorized: Admin access required")
	}

	return user
}

/**
 * Get user with CMS access (admin, developer, or editor)
 * Excludes users with role "user"
 */
export const getAuthenticatedCMSUser = async (ctx: QueryCtx) => {
	const user = await getAuthenticatedUser(ctx)

	if (!user) {
		return null
	}

	if (user.role === "user") {
		throw new ConvexError(
			"Unauthorized: You don't have permission to access the CMS",
		)
	}

	return user
}

/**
 * Get user who can manage content (admin, developer, or editor)
 */
export const getAuthenticatedContentUser = async (ctx: QueryCtx) => {
	const user = await getAuthenticatedUser(ctx)

	if (!user) {
		return null
	}

	const allowedRoles = ["admin", "developer", "editor"]
	if (!allowedRoles.includes(user.role)) {
		throw new ConvexError(
			"Unauthorized: You don't have permission to manage content",
		)
	}

	return user
}

/**
 * Get user who can manage schemas/blocks (admin or developer)
 */
export const getAuthenticatedDeveloperUser = async (ctx: QueryCtx) => {
	const user = await getAuthenticatedUser(ctx)

	if (!user) {
		return null
	}

	const allowedRoles = ["admin", "developer"]
	if (!allowedRoles.includes(user.role)) {
		throw new ConvexError("Unauthorized: Developer or Admin access required")
	}

	return user
}
