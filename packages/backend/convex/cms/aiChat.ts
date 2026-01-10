import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { getAuthenticatedCMSUser } from "./utils"

// ================================
// QUERIES
// ================================

/**
 * Get all chat conversations for the current user
 */
export const listChats = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) return null

		const chats = await ctx.db
			.query("cmsAIChats")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect()

		return chats
	},
})

/**
 * Get a specific chat conversation by ID
 */
export const getChat = query({
	args: {
		chatId: v.id("cmsAIChats"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) return null

		const chat = await ctx.db.get(args.chatId)

		if (!chat) {
			throw new ConvexError("Chat not found")
		}

		if (chat.userId !== user._id) {
			throw new ConvexError("Unauthorized: You don't own this chat")
		}

		return chat
	},
})

/**
 * Get the most recent chat for the current user
 */
export const getRecentChat = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) return null

		const chat = await ctx.db
			.query("cmsAIChats")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.first()

		return chat
	},
})

// ================================
// MUTATIONS
// ================================

/**
 * Create a new chat conversation
 */
export const createChat = mutation({
	args: {
		title: v.optional(v.string()),
		initialMessage: v.optional(
			v.object({
				id: v.string(),
				role: v.union(v.literal("user"), v.literal("assistant")),
				content: v.string(),
				createdAt: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const now = Date.now()
		const messages = args.initialMessage ? [args.initialMessage] : []

		const chatId = await ctx.db.insert("cmsAIChats", {
			userId: user._id,
			messages,
			title: args.title,
			createdAt: now,
			updatedAt: now,
		})

		return chatId
	},
})

/**
 * Add a message to an existing chat
 */
export const addMessage = mutation({
	args: {
		chatId: v.id("cmsAIChats"),
		message: v.object({
			id: v.string(),
			role: v.union(v.literal("user"), v.literal("assistant")),
			content: v.string(),
			createdAt: v.number(),
		}),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const chat = await ctx.db.get(args.chatId)

		if (!chat) {
			throw new ConvexError("Chat not found")
		}

		if (chat.userId !== user._id) {
			throw new ConvexError("Unauthorized: You don't own this chat")
		}

		await ctx.db.patch(args.chatId, {
			messages: [...chat.messages, args.message],
			updatedAt: Date.now(),
		})

		return args.chatId
	},
})

/**
 * Update chat title
 */
export const updateChatTitle = mutation({
	args: {
		chatId: v.id("cmsAIChats"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const chat = await ctx.db.get(args.chatId)

		if (!chat) {
			throw new ConvexError("Chat not found")
		}

		if (chat.userId !== user._id) {
			throw new ConvexError("Unauthorized: You don't own this chat")
		}

		await ctx.db.patch(args.chatId, {
			title: args.title,
			updatedAt: Date.now(),
		})

		return args.chatId
	},
})

/**
 * Delete a chat conversation
 */
export const deleteChat = mutation({
	args: {
		chatId: v.id("cmsAIChats"),
	},
	handler: async (ctx, args) => {
		const user = await getAuthenticatedCMSUser(ctx)
		if (!user) {
			throw new ConvexError("Unauthorized")
		}

		const chat = await ctx.db.get(args.chatId)

		if (!chat) {
			throw new ConvexError("Chat not found")
		}

		if (chat.userId !== user._id) {
			throw new ConvexError("Unauthorized: You don't own this chat")
		}

		await ctx.db.delete(args.chatId)

		return { success: true }
	},
})
