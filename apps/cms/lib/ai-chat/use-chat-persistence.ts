"use client"

import type { UIMessage } from "@ai-sdk/react"
import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useCallback, useEffect } from "react"
import {
	type ChatSession,
	chatSessionsAtom,
	clearChatContext,
	currentChatIdAtom,
	messagesAtom,
	setChatError,
} from "./context-atoms"

// ================================
// HOOK
// ================================

/**
 * Hook to manage chat persistence with Convex
 * Syncs chat state with the database
 */
export function useChatPersistence() {
	const [currentChatId, setCurrentChatId] = useAtom(currentChatIdAtom)
	const [messages, setMessages] = useAtom(messagesAtom)
	const [sessions, setSessions] = useAtom(chatSessionsAtom)

	// Convex queries and mutations
	const chats = useQuery(api.cms.aiChat.listChats)
	const currentChat = useQuery(
		api.cms.aiChat.getChat,
		currentChatId ? { chatId: currentChatId as Id<"cmsAIChats"> } : "skip",
	)

	const createChatMutation = useMutation(api.cms.aiChat.createChat)
	const addMessageMutation = useMutation(api.cms.aiChat.addMessage)
	const updateTitleMutation = useMutation(api.cms.aiChat.updateChatTitle)
	const deleteChatMutation = useMutation(api.cms.aiChat.deleteChat)

	// Sync sessions from Convex
	useEffect(() => {
		if (chats) {
			const chatSessions: ChatSession[] = chats.map((chat) => ({
				id: chat._id,
				title: chat.title,
				createdAt: chat.createdAt,
				updatedAt: chat.updatedAt,
			}))
			setSessions(chatSessions)
		}
	}, [chats, setSessions])

	// Sync messages when current chat changes
	useEffect(() => {
		if (currentChat?.messages) {
			const uiMessages: UIMessage[] = currentChat.messages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
				createdAt: new Date(msg.createdAt),
				parts: [{ type: "text" as const, text: msg.content }],
			}))
			setMessages(uiMessages)
		}
	}, [currentChat, setMessages])

	/**
	 * Create a new chat session
	 */
	const createChat = useCallback(
		async (title?: string, initialMessage?: UIMessage) => {
			try {
				const storedMessage = initialMessage
					? {
							id: initialMessage.id,
							role: initialMessage.role as "user" | "assistant",
							content: getMessageContent(initialMessage),
							createdAt: Date.now(),
						}
					: undefined

				const chatId = await createChatMutation({
					title,
					initialMessage: storedMessage,
				})

				setCurrentChatId(chatId)
				return chatId
			} catch (error) {
				setChatError(
					error instanceof Error ? error.message : "Failed to create chat",
				)
				return null
			}
		},
		[createChatMutation, setCurrentChatId],
	)

	/**
	 * Add a message to the current chat
	 */
	const addMessage = useCallback(
		async (message: UIMessage) => {
			if (!currentChatId) {
				// Create a new chat if none exists
				const chatId = await createChat(undefined, message)
				return chatId !== null
			}

			try {
				await addMessageMutation({
					chatId: currentChatId as Id<"cmsAIChats">,
					message: {
						id: message.id,
						role: message.role as "user" | "assistant",
						content: getMessageContent(message),
						createdAt: Date.now(),
					},
				})
				return true
			} catch (error) {
				setChatError(
					error instanceof Error ? error.message : "Failed to add message",
				)
				return false
			}
		},
		[currentChatId, addMessageMutation, createChat],
	)

	/**
	 * Update chat title
	 */
	const updateTitle = useCallback(
		async (title: string) => {
			if (!currentChatId) return false

			try {
				await updateTitleMutation({
					chatId: currentChatId as Id<"cmsAIChats">,
					title,
				})
				return true
			} catch (error) {
				setChatError(
					error instanceof Error ? error.message : "Failed to update title",
				)
				return false
			}
		},
		[currentChatId, updateTitleMutation],
	)

	/**
	 * Delete a chat
	 */
	const deleteChat = useCallback(
		async (chatId: string) => {
			try {
				await deleteChatMutation({
					chatId: chatId as Id<"cmsAIChats">,
				})

				// If deleting current chat, clear context
				if (chatId === currentChatId) {
					clearChatContext()
				}

				return true
			} catch (error) {
				setChatError(
					error instanceof Error ? error.message : "Failed to delete chat",
				)
				return false
			}
		},
		[deleteChatMutation, currentChatId],
	)

	/**
	 * Load a chat by ID
	 */
	const loadChat = useCallback(
		(chatId: string) => {
			setCurrentChatId(chatId)
		},
		[setCurrentChatId],
	)

	/**
	 * Start a new chat (clears current context)
	 */
	const startNewChat = useCallback(() => {
		clearChatContext()
	}, [])

	return {
		// State
		currentChatId,
		messages,
		sessions,
		isLoading: chats === undefined,

		// Actions
		createChat,
		addMessage,
		updateTitle,
		deleteChat,
		loadChat,
		startNewChat,
	}
}

// ================================
// HELPERS
// ================================

function getMessageContent(message: UIMessage): string {
	// Extract text content from message parts
	if (message.parts) {
		return message.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => part.text)
			.join("")
	}
	return ""
}
