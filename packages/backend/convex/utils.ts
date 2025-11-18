import { ConvexError } from "convex/values"
import type { QueryCtx } from "./_generated/server"
import { authComponent } from "./auth"

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

	// Spread authUser first, then user - this ensures user._id (Id<"users">)
	// takes precedence over authUser._id (Id<"user">)
	return { ...authUser, ...user }
}
