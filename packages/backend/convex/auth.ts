import { type AuthFunctions, createClient } from "@convex-dev/better-auth"
import { withoutSystemFields } from "convex-helpers"
import { components, internal } from "./_generated/api"
import type { DataModel, Id } from "./_generated/dataModel"
import { query } from "./_generated/server"

// Typesafe way to pass the functions below into the component
const authFunctions: AuthFunctions = internal.auth

// Initialize the client (0.8+)
export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,

	triggers: {
		user: {
			onCreate: async (ctx, authUser) => {
				const existingUser = await ctx.db
					.query("users")
					.withIndex("email", (q) => q.eq("email", authUser.email))
					.unique()

				if (existingUser) {
					// If the user already exists, link the auth ID if it's missing
					if (!existingUser.authId) {
						await ctx.db.patch(existingUser._id, { authId: authUser._id })
					}

					// Check if user is active
					if (!existingUser.isActive) {
						throw new Error(
							"Your account has been disabled. Please contact an administrator.",
						)
					}
					return
				}

				// Check if this is the first user in the system
				const allUsers = await ctx.db.query("users").collect()
				const isFirstUser = allUsers.length === 0

				// If not the first user, check for invitation
				if (!isFirstUser) {
					const invitation = await ctx.db
						.query("cmsUserInvitations")
						.withIndex("by_email", (q) => q.eq("email", authUser.email))
						.filter((q) => q.eq(q.field("status"), "pending"))
						.first()

					if (!invitation) {
						throw new Error(
							"You need an invitation to register. Please contact an administrator.",
						)
					}

					// Create user with invited role
					await ctx.db.insert("users", {
						email: authUser.email,
						name: authUser.name,
						role: invitation.role,
						authId: authUser._id,
						isActive: true,
					})

					// Mark invitation as accepted
					await ctx.db.patch(invitation._id, {
						status: "accepted",
						acceptedAt: Date.now(),
					})
				} else {
					// First user automatically becomes admin
					await ctx.db.insert("users", {
						email: authUser.email,
						name: authUser.name,
						role: "admin",
						authId: authUser._id,
						isActive: true,
					})
				}
			},
			onUpdate: async (ctx, newUser) => {
				const user = await ctx.db
					.query("users")
					.withIndex("authId", (q) => q.eq("authId", newUser._id))
					.unique()

				if (!user) {
					console.warn(
						`User with authId ${newUser._id} not found. Cannot update.`,
					)
					return
				}

				await ctx.db.patch(user._id, {
					email: newUser.email,
					name: newUser.name,
				})
			},
			onDelete: async (ctx, authUser) => {
				if (authUser.userId) {
					await ctx.db.delete(authUser.userId as Id<"users">)
				}
			},
		},
	},
})

// Export triggers for Convex wiring
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

// Export auth user query for AuthBoundary client component
export const { getAuthUser } = authComponent.clientApi()

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		// Get user data from Better Auth - email, name, image, etc.
		const authUser = await authComponent.safeGetAuthUser(ctx)
		if (!authUser) {
			return null
		}
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser._id))
			.unique()

		if (!user) {
			return null
		}

		return { ...user, ...withoutSystemFields(authUser) }
	},
})
