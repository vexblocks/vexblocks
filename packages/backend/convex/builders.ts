import { ConvexError } from "convex/values"
import {
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions"
import { mutation, query } from "./_generated/server"
import { getAuthenticatedUser } from "./utils"

// Base authenticated query builder
export const authenticatedQuery = customQuery(query, {
	args: {},
	input: async (ctx, args) => {
		const userIdentity = await getAuthenticatedUser(ctx)

		if (!userIdentity) {
			throw new ConvexError("User not authenticated")
		}

		const userId = userIdentity._id

		return {
			ctx: {
				...ctx,
				user: userIdentity,
				userId,
				userIdentity,
			},
			args,
		}
	},
})

// Base authenticated mutation builder
export const authenticatedMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, args) => {
		const userIdentity = await getAuthenticatedUser(ctx)

		if (!userIdentity) {
			throw new ConvexError("User not authenticated")
		}

		const userId = userIdentity._id

		return {
			ctx: {
				...ctx,
				user: userIdentity,
				userId,
				userIdentity,
			},
			args,
		}
	},
})

// Admin-only query builder
export const adminQuery = customQuery(query, {
	args: {},
	input: async (ctx, args) => {
		const userIdentity = await getAuthenticatedUser(ctx)

		if (!userIdentity) {
			throw new ConvexError("User not authenticated")
		}

		const userId = userIdentity._id

		if (userIdentity.role !== "admin") {
			throw new ConvexError("Access denied. Admin role required.")
		}

		return {
			ctx: {
				...ctx,
				user: userIdentity,
				userId,
				userIdentity,
			},
			args,
		}
	},
})

// Admin-only mutation builder
export const adminMutation = customMutation(mutation, {
	args: {},
	input: async (ctx, args) => {
		const userIdentity = await getAuthenticatedUser(ctx)

		if (!userIdentity) {
			throw new ConvexError("User not authenticated")
		}

		const userId = userIdentity._id

		if (userIdentity.role !== "admin") {
			throw new ConvexError("Access denied. Admin role required.")
		}

		return {
			ctx: {
				...ctx,
				user: userIdentity,
				userId,
				userIdentity,
			},
			args,
		}
	},
})
