import fs from "node:fs"
import path from "node:path"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { streamText } from "ai"
import { isAuthenticated } from "@/lib/auth-server"
import { tools } from "./tools"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const google = createGoogleGenerativeAI({
	apiKey: process.env.GOOGLE_GEMINI_API_KEY,
})

// Load generated types for context
const getGeneratedTypesContext = () => {
	try {
		const typesPath = path.join(
			process.cwd(),
			"../../packages/cms-shared/src/types/generated.ts",
		)
		const typesContent = fs.readFileSync(typesPath, "utf-8")
		return typesContent
	} catch (error) {
		console.error("Error loading generated types:", error)
		return "// Types not available"
	}
}

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

		// Load generated types for context
		const generatedTypes = getGeneratedTypesContext()

		// Create the AI stream with Gemini 2.5 Flash and tools
		const result = streamText({
			model: google("gemini-2.5-flash"),
			messages: convertedMessages,
			system: `You are an AI assistant for VexBlocks CMS, a headless content management system.
Your role is to help users manage their content, schemas, and CMS operations efficiently.

## Database Context
Here are the current CMS types and schemas in the database:

\`\`\`typescript
${generatedTypes}
\`\`\`

## Your Capabilities
You have access to tools that allow you to:
1. **Read schemas** - List and view existing content schemas
2. **Create schemas** - Create new content schemas with fields
3. **Update schemas** - Modify existing schemas (requires double confirmation)
4. **Read content** - View existing content entries
5. **Create content** - Add new content entries to schemas
6. **Update content** - Modify existing content entries

## Safety Rules (CRITICAL)
- You CANNOT delete schemas or content (no delete operations allowed)
- You CANNOT remove fields from schemas (only add or modify)
- When updating schemas, you MUST ask for confirmation TWICE before proceeding
- Always validate data against schema field types before creating/updating content
- Be cautious with schema changes as they affect the entire CMS structure

## Best Practices
- Always check existing schemas before creating new ones
- Validate field types and requirements
- Use clear, descriptive names for schemas and fields
- Explain what you're doing before using tools
- Ask for clarification if requirements are unclear

Be concise, helpful, and professional. Always prioritize data integrity and user confirmation for critical operations.`,
			tools,
		})

		// Use toUIMessageStreamResponse() for proper streaming with useChat
		return result.toUIMessageStreamResponse()
	} catch (error) {
		console.error("AI Chat error:", error)
		return new Response("Internal Server Error", { status: 500 })
	}
}
