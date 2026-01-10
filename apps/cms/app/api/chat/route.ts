import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"
import { isAuthenticated } from "@/lib/auth-server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GEMINI_API_KEY,
})

export async function POST(req: Request) {
	try {
		// Check authentication
		const authenticated = await isAuthenticated()
		if (!authenticated) {
			return new Response("Unauthorized", { status: 401 })
		}

		const { messages } = await req.json()

		console.log("Received messages:", JSON.stringify(messages, null, 2))

		// Convert UIMessage format (with parts) to standard message format (with content)
		const convertedMessages = messages.map((message: any) => {
			// If message already has content field, use it
			if (message.content) {
				return message
			}

			// Convert parts to content
			if (message.parts) {
				const textContent = message.parts
					.filter((part: any) => part.type === "text")
					.map((part: any) => part.text)
					.join("")

				return {
					role: message.role,
					content: textContent,
				}
			}

			return message
		})

		console.log(
			"Converted messages:",
			JSON.stringify(convertedMessages, null, 2),
		)

		// Create the AI stream with Gemini 2.5 Flash
		const result = streamText({
			model: google("gemini-2.5-flash"),
			messages: convertedMessages,
			system: `You are an AI assistant for VexBlocks CMS, a headless content management system.
Your role is to help users manage their content, schemas, and CMS operations efficiently.

Key capabilities you can help with:
- Creating and managing content schemas
- Adding and editing content entries
- Understanding the CMS structure
- Explaining how to use different features
- Providing guidance on best practices

Be concise, helpful, and professional. When providing code examples or technical instructions,
format them clearly and explain the purpose.`,
		})

		// Use toUIMessageStreamResponse() for proper streaming with useChat
		return result.toUIMessageStreamResponse()
	} catch (error) {
		console.error("AI Chat error:", error)
		return new Response("Internal Server Error", { status: 500 })
	}
}
